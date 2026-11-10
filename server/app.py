"""Local web interface to the official Anki engine. One process, one collection owner."""
from __future__ import annotations
import csv
import html
import io
import json
from dataclasses import asdict
import os
import re
import shutil
import tempfile
import time
import uuid
import zipfile
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

import bleach
from anki.collection import Collection
from anki.cards import Card
from anki import import_export_pb2 as imex
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from .vendor.anki_star.core import parse_notes as parse_star, validate_note as validate_star, build_prompt as star_prompt, FormatError
from .vendor.anki_star.collection import import_notes as import_star
from .presentation import present, preview_fields, normalize_designs
from starlette.background import BackgroundTask
from starlette.middleware.trustedhost import TrustedHostMiddleware

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(os.environ.get('RECALL_DATA_DIR', ROOT / '.data')).resolve()
MAX_UPLOAD = 50 * 1024 * 1024


def plain(value: str) -> str:
    return html.unescape(bleach.clean(value, tags=[], strip=True)).strip()


def safe_html(value: str) -> str:
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', value, flags=re.S | re.I)
    def media(match):
        name = html.unescape(match.group(1))
        return f'<audio controls src="/media/{quote(name, safe="")}"></audio>'
    value = re.sub(r'\[sound:([^\]]+)\]', media, value)
    def src(match):
        name = html.unescape(match.group(2))
        if name.startswith('/media/'):
            return match.group(0)
        if urlparse(name).scheme or name.startswith(('/', '//')):
            return 'src=""'
        return f'src="/media/{quote(name, safe="")}"'
    value = re.sub(r'\bsrc\s*=\s*([\"\'])(.*?)\1', src, value, flags=re.I)
    return bleach.clean(value, tags=['p','br','div','span','b','strong','i','em','u','s','sub','sup','ul','ol','li','blockquote','pre','code','hr','img','audio','a','table','thead','tbody','tr','td','th'], attributes={'*':['class','dir'], 'img':['src','alt','width','height'], 'audio':['src','controls'], 'a':['href','title']}, protocols=['http','https','mailto'], strip=True)


def parse_text(text: str, separator: str = 'auto', skip_header: bool = False):
    if len(text) > 2_000_000:
        raise ValueError('Text imports are limited to 2 MB. Split this set into smaller files.')
    lines = text.lstrip('\ufeff').splitlines()
    # Anki text metadata is not card content.
    metadata = [line for line in lines if line.startswith('#')]
    if separator == 'auto':
        declared = next((line.split(':', 1)[1].strip().lower() for line in metadata if line.startswith('#separator:')), '')
        separator = {'tab':'tab','comma':'comma','semicolon':'semicolon'}.get(declared, 'tab' if '\t' in text else 'comma')
    delimiter = {'tab':'\t', 'comma':',', 'semicolon':';'}.get(separator)
    if not delimiter:
        raise ValueError('Choose tab, comma, or semicolon as the separator.')
    body = '\n'.join(line for line in lines if not line.startswith('#'))
    reader = csv.reader(io.StringIO(body), delimiter=delimiter, strict=True)
    result, warnings, seen = [], [], set()
    if skip_header:
        next(reader, None)
    for i, row in enumerate(reader, 2 if skip_header else 1):
        if not any(v.strip() for v in row):
            continue
        if len(row) < 2 or not plain(row[0]) or not plain(row[1]):
            warnings.append(f'Row {i}: a question and an answer are required.')
            continue
        front, back = row[0].strip(), row[1].strip()
        key = (plain(front).casefold(), plain(back).casefold())
        if key in seen:
            warnings.append(f'Row {i}: duplicate skipped.')
            continue
        seen.add(key)
        result.append({'front':front, 'back':back})
        if len(row) > 2:
            warnings.append(f'Row {i}: only the first two columns will be imported.')
        if len(result) > 10_000:
            raise ValueError('Import up to 10,000 cards at a time.')
    if not result:
        raise ValueError('No cards found. Put a question and answer on each row, separated by a tab or comma.')
    return result, warnings


class Engine:
    def __init__(self, directory: Path):
        directory.mkdir(parents=True, exist_ok=True)
        self.directory = directory
        self.col = Collection(str(directory / 'collection.anki2'))
        self.active = None
        self.undo_available = False
        self.pending = {}
        if not self.col.get_config('recall_initialized'):
            self.col.set_config('fsrs', True)
            config = self.col.decks.get_config(1)
            config['new']['perDay'] = 10
            config['new']['bury'] = True
            config['rev']['bury'] = True
            config['buryInterdayLearning'] = True
            config['newMix'] = 1  # reviews first, new cards afterwards
            config['lapse']['leechAction'] = 0
            self.col.decks.update_config(config)
            prefs = self.col.get_preferences()
            prefs.scheduling.learn_ahead_secs = 0
            self.col.set_preferences(prefs)
            self.col.set_config('recall_initialized', True)
        if not self.col.get_config('recall_clean_design_v1'):
            if self.col.card_count():
                self.col.export_anki_package(out_path=str(directory/'before-clean-layout.apkg'),options=imex.ExportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True,with_media=True),limit=None)
            normalize_designs(self.col)
            self.col.set_config('recall_clean_design_v1', True)

    def invalidate(self):
        self.active = None
        self.undo_available = False

    def close(self):
        for entry in self.pending.values():
            if 'directory' in entry:
                shutil.rmtree(entry['directory'], ignore_errors=True)
        self.col.close()

    def decks(self):
        counts = {}
        def walk(node):
            counts[node.deck_id] = {'new':node.new_count, 'learning':node.learn_count, 'review':node.review_count}
            for child in node.children:
                walk(child)
        walk(self.col.sched.deck_due_tree())
        result = []
        decks = self.col.decks.all_names_and_ids()
        folders = set(self.col.get_config('recall_folders', []))
        for deck in decks:
            total = self.col.db.scalar('select count(*) from cards where did=?', deck.id)
            folder = str(deck.id) in folders or any(d.name.startswith(deck.name + '::') for d in decks)
            if deck.id == 1 and total == 0 and not folder:
                continue
            cnt = counts.get(deck.id, {'new':0,'learning':0,'review':0})
            result.append({'id':str(deck.id), 'name':deck.name, 'total':total, 'folder':folder, **cnt, 'ready':sum(cnt.values())})
        return result

    def stats(self):
        now = datetime.now().astimezone()
        # Use Anki's study-day rollover for all displayed daily review counts.
        cutoff = self.col.sched.day_cutoff
        start = cutoff - 86400
        reviewed, seconds, recalled = self.col.db.first('select count(*), coalesce(sum(time),0)/1000.0, coalesce(sum(ease>1),0) from revlog where id>=? and ease>0', start*1000)
        days = []
        for offset in range(6,-1,-1):
            day_start = start - offset*86400
            count = self.col.db.scalar('select count(*) from revlog where id>=? and id<? and ease>0', day_start*1000,(day_start+86400)*1000)
            date = datetime.fromtimestamp(day_start + 43200).astimezone()
            days.append({'date':date.strftime('%Y-%m-%d'),'label':date.strftime('%a'),'count':count})
        total, successes = self.col.db.first('select count(*), coalesce(sum(ease>1),0) from revlog where id>=? and type=1 and ease>0', int((now-timedelta(days=30)).timestamp()*1000))
        upcoming = self.col.db.scalar('select min(due) from cards where queue=1 and due>?', time.time())
        return {'reviewedToday':reviewed,'minutesToday':round(seconds/60,1),'days':days,'recallRate':round(successes/total*100) if total else None,'recallSample':total,'totalCards':self.col.card_count(), 'nextLearningAt':upcoming, 'engine':'26.9.4'}

    def next_card(self, deck_id: str | None):
        if self.active and self.active['scope'] == deck_id:
            return self.active['public']
        self.active = None
        if deck_id:
            if not self.col.decks.get(int(deck_id), default=False):
                raise HTTPException(404, 'This deck no longer exists.')
            ids = [int(deck_id)]
        else:
            decks = self.decks()
            # Due reviews take precedence across decks.
            ids = [int(d['id']) for d in sorted(decks, key=lambda d:(not(d['review'] or d['learning']), d['name']))]
        for did in ids:
            self.col.decks.select(did)
            queue = self.col.sched.get_queued_cards()
            if not queue.cards:
                continue
            queued = queue.cards[0]
            card = self.col.get_card(queued.card.id)
            card.start_timer()
            token = uuid.uuid4().hex
            view = present(card, safe_html)
            public = {'token':token,'id':str(card.id),'deck':self.col.decks.name(card.did),'question':view['question'],'requiresTypedAnswer':view['requiresTypedAnswer'],'remaining':queue.new_count+queue.learning_count+queue.review_count,'isNew':card.type==0}
            self.active = {'card':card,'states':queued.states,'scope':deck_id,'public':public,'revealed':False,'view':view}
            return public
        return None

    def require_active(self, token):
        if not self.active or self.active['public']['token'] != token:
            raise HTTPException(409,'This review has changed. Reload the session before answering.')
        return self.active

    def add_pairs(self, name, rows):
        did = self.col.decks.id(name)
        # Dedicated model avoids depending on the user's imported/localized Basic model.
        model = self.col.models.by_name('Recall Basic')
        if model is None:
            model = self.col.models.new('Recall Basic')
            for field in ['Question','Answer','Extra','Source']:
                self.col.models.add_field(model,self.col.models.new_field(field))
            template = self.col.models.new_template('Card')
            template['qfmt'] = '{{Question}}'
            template['afmt'] = '{{FrontSide}}<hr id=answer>{{Answer}}{{#Extra}}<hr><b>Explanation</b><br>{{Extra}}{{/Extra}}{{#Source}}<hr><b>Source</b><br>{{Source}}{{/Source}}'
            self.col.models.add_template(model,template)
            self.col.models.add(model)
        if [f['name'] for f in model['flds']] == ['Question','Answer']:
            for field in ['Extra','Source']:
                self.col.models.add_field(model,self.col.models.new_field(field))
            model['tmpls'][0]['afmt'] += '{{#Extra}}<hr><b>Explanation</b><br>{{Extra}}{{/Extra}}{{#Source}}<hr><b>Source</b><br>{{Source}}{{/Source}}'
            self.col.models.save(model)
        existing = {(plain(f.split('\x1f')[0]).casefold(),plain(f.split('\x1f')[1]).casefold()) for f, in self.col.db.all('select n.flds from notes n join cards c on c.nid=n.id where c.did=? and n.mid=?',did,model['id'])}
        added = 0
        for row in rows:
            key = (plain(row['front']).casefold(),plain(row['back']).casefold())
            if key in existing:
                continue
            note = self.col.new_note(model)
            note.fields = [safe_html(row['front']),safe_html(row['back']),safe_html(row.get('extra','')),safe_html(row.get('source',''))]
            self.col.add_note(note,did)
            existing.add(key)
            added += 1
        self.invalidate()
        return {'deckId':str(did),'added':added,'skipped':len(rows)-added}


@asynccontextmanager
async def lifespan(app):
    app.state.engine = Engine(DATA)
    yield
    app.state.engine.close()

app = FastAPI(title='Recall local API', lifespan=lifespan)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=['127.0.0.1','localhost','testserver'])

@app.middleware('http')
async def protect_local_api(request: Request, call_next):
    origin = request.headers.get('origin')
    if origin and origin not in {f"{request.url.scheme}://{request.headers.get('host', '')}", 'http://127.0.0.1:5173', 'http://localhost:5173'}:
        return JSONResponse({'detail':'This local service only accepts requests from Recall.'},403)
    if request.method not in {'GET','HEAD','OPTIONS'} and request.headers.get('x-recall-request') != '1':
        return JSONResponse({'detail':'Missing local application request header.'},403)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
    if request.url.path.startswith('/api'):
        response.headers['Cache-Control'] = 'no-store'
    return response


def engine(request):
    return request.app.state.engine

class DeckInput(BaseModel):
    name: str = Field(min_length=1,max_length=120)
    parentId: str | None = None
    folder: bool = False

class NoteInput(BaseModel):
    deckId: str
    fields: list[str] = Field(min_length=2,max_length=100)

class TokenInput(BaseModel):
    token: str

class AnswerInput(TokenInput):
    rating: int = Field(ge=1,le=4)

class TextInput(BaseModel):
    text: str
    separator: str = 'auto'
    skipHeader: bool = False

class CommitInput(TokenInput):
    name: str = Field(min_length=1,max_length=120)
    scheduling: bool = True

class SettingsInput(BaseModel):
    newPerDay: int = Field(ge=0,le=100)
    retention: float = Field(ge=0.80,le=0.97)

@app.get('/api/dashboard')
async def dashboard(request: Request):
    e=engine(request)
    return {'decks':e.decks(),'stats':e.stats()}

@app.post('/api/decks')
async def create_deck(data: DeckInput,request: Request):
    name=data.name.strip()
    if not name or any(not part.strip() for part in name.split('::')):
        raise HTTPException(422,'Give each folder or deck a name.')
    e=engine(request)
    if data.parentId is not None:
        parent=next((d for d in e.col.decks.all_names_and_ids() if str(d.id)==data.parentId),None)
        if parent is None:
            raise HTTPException(404,'That folder no longer exists. Choose another location.')
        name=parent.name+'::'+name
    if e.col.decks.by_name(name):
        raise HTTPException(409,'A folder or deck with that name already exists here. Choose another name.')
    e.invalidate()
    did=str(e.col.decks.id(name))
    if data.folder:
        folders=e.col.get_config('recall_folders',[])
        e.col.set_config('recall_folders',list(dict.fromkeys([*folders,did])))
    return {'id':did}

@app.get('/api/decks/{did}/notes')
async def notes(did: int, request: Request, q: str='', offset: int=0):
    e=engine(request)
    ids=e.col.db.list('select distinct nid from cards where did=? order by nid desc',did)
    result=[]
    for nid in ids:
        note=e.col.get_note(nid)
        if q.casefold() not in ' '.join(note.fields).casefold():
            continue
        result.append({'id':str(nid),'fields':note.fields,'fieldNames':list(note.keys()),'model':note.note_type()['name'],**preview_fields(note),'suspended':all(c.queue == -1 for c in note.cards())})
    return {'notes':result[max(0,offset):max(0,offset)+100],'total':len(result)}

@app.post('/api/notes')
async def add_note(data: NoteInput,request: Request):
    e=engine(request); deck=e.col.decks.get(int(data.deckId),default=False)
    if not deck:
        raise HTTPException(404,'Deck not found.')
    if not all(plain(v) for v in data.fields[:2]):
        raise HTTPException(422,'Add both a question and an answer.')
    return e.add_pairs(deck['name'],[{'front':data.fields[0],'back':data.fields[1],'extra':data.fields[2] if len(data.fields)>2 else '', 'source':data.fields[3] if len(data.fields)>3 else ''}])

@app.put('/api/notes/{nid}')
async def edit_note(nid: int,data: NoteInput,request: Request):
    e=engine(request); note=e.col.get_note(nid)
    if len(data.fields)==2 and list(note.keys())==['Question','Answer','Extra','Source']:
        data.fields += note.fields[2:]
    if len(data.fields)!=len(note.fields) or not plain(data.fields[0]):
        raise HTTPException(422,'Keep all note fields and a non-empty first field.')
    note.fields=[safe_html(v) for v in data.fields]
    e.col.update_note(note);e.invalidate()
    return {'saved':True}

@app.delete('/api/notes/{nid}')
async def delete_note(nid: int,request: Request):
    e=engine(request);e.col.remove_notes([nid]);e.invalidate()
    return {'deleted':True}

@app.post('/api/notes/{nid}/suspend')
async def suspend(nid: int,request: Request):
    e=engine(request);cards=e.col.get_note(nid).cards()
    if all(c.queue==-1 for c in cards):
        e.col.sched.unsuspend_cards([c.id for c in cards])
    else:
        e.col.sched.suspend_cards([c.id for c in cards])
    e.invalidate();return {'saved':True}

@app.get('/api/study/next')
async def study_next(request: Request,deck: str | None=None):
    e=engine(request)
    return {'card':e.next_card(deck),'canUndo':e.undo_available,'stats':e.stats()}

@app.post('/api/study/reveal')
async def reveal(data: TokenInput,request: Request):
    e=engine(request);a=e.require_active(data.token);a['revealed']=True
    return {**{k:v for k,v in a['view'].items() if k != 'question'},'intervals':list(e.col.sched.describe_next_states(a['states']))}

@app.post('/api/study/answer')
async def answer(data: AnswerInput,request: Request):
    e=engine(request);a=e.require_active(data.token)
    if not a['revealed']:
        raise HTTPException(409,'Reveal the answer before rating your recall.')
    rating=[0,1,2,3][data.rating-1]
    answer=e.col.sched.build_answer(card=a['card'],states=a['states'],rating=rating)
    e.col.sched.answer_card(answer)
    e.active=None;e.undo_available=True
    return {'saved':True}

@app.post('/api/study/undo')
async def undo(request: Request):
    e=engine(request)
    if not e.undo_available:
        raise HTTPException(409,'There is no review to undo.')
    e.col.undo();e.active=None;e.undo_available=False
    return {'undone':True}

@app.post('/api/import/text/preview')
async def preview_text(data: TextInput,request: Request):
    try:
        rows,warnings=parse_text(data.text,data.separator,data.skipHeader)
    except (ValueError,csv.Error) as exc:
        raise HTTPException(422,str(exc))
    e=engine(request);token=uuid.uuid4().hex
    e.pending[token]={'kind':'text','rows':rows,'created':time.time()}
    return {'token':token,'kind':'text','count':len(rows),'preview':[{'front':plain(r['front']),'back':plain(r['back'])} for r in rows[:5]],'warnings':warnings[:20],'warningCount':len(warnings)}


class StarCommitInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    notes: list[dict] = Field(min_length=1, max_length=500)

class PromptInput(BaseModel):
    context: str = Field(default='', max_length=100_000)
    focus: str = Field(default='', max_length=500)
    count: int = Field(default=20, ge=1, le=100)
    understanding: bool = True

@app.post('/api/import/star/preview')
async def preview_star(data: TextInput, request: Request):
    try:
        notes = parse_star(data.text)
    except (FormatError, ValueError) as exc:
        raise HTTPException(422, str(exc))
    return {'notes':[asdict(n) for n in notes], 'cards':sum(n.card_count for n in notes)}

@app.post('/api/import/star/commit')
async def commit_star(data: StarCommitInput, request: Request):
    e = engine(request)
    try:
        if len(json.dumps(data.notes, ensure_ascii=False)) > 2_000_000:
            raise ValueError('Import up to 2 MB of notes at a time.')
        drafts = [validate_star(n, i) for i,n in enumerate(data.notes,1)]
        result = import_star(e.col, drafts, data.name)
        normalize_designs(e.col)
    except (FormatError, ValueError) as exc:
        raise HTTPException(422, str(exc))
    e.invalidate()
    return {'added':result.added,'cards':result.cards,'skipped':result.skipped,'deckId':str(e.col.decks.id(data.name))}

@app.post('/api/import/star/prompt')
async def prepare_prompt(data: PromptInput):
    prompt = star_prompt(data.context, data.focus, data.count)
    if data.understanding:
        policy = """Where the sources support it, mix factual recall with questions requiring an explanation,
comparison of confusable ideas, and application to a short new example. Do not force a fixed ratio.
Use basic notes for these questions. Put a concise answer rubric in back, and an explanation
of why the answer works in extra. Use tags recall::explain, recall::compare or recall::apply as
appropriate, alongside topic tags. Each question must be answerable on its own. For application,
derive the answer strictly from the source; omit ambiguous or unsupported applications.
Never label two answers in one session as durable mastery. A human will check every draft.
"""
        prompt = prompt.replace('SOURCE CONTEXT (may be empty', policy+'\nSOURCE CONTEXT (may be empty',1)
    return {'prompt':prompt}

@app.post('/api/import/anki/preview')
async def preview_anki(request: Request,file: UploadFile=File(...)):
    if not (file.filename or '').lower().endswith('.apkg'):
        raise HTTPException(422,'Choose an Anki deck package (.apkg).')
    content=await file.read(MAX_UPLOAD+1)
    if len(content)>MAX_UPLOAD:
        raise HTTPException(413,'This package is larger than 50 MB. Export a smaller deck from Anki.')
    directory=Path(tempfile.mkdtemp(prefix='recall-import-'))
    package=directory/'import.apkg';package.write_bytes(content)
    preview=None
    try:
        with zipfile.ZipFile(package) as archive:
            if sum(item.file_size for item in archive.infolist())>250*1024*1024:
                raise ValueError('Expanded package exceeds 250 MB.')
        preview=Collection(str(directory/'preview.anki2'))
        preview.import_anki_package(imex.ImportAnkiPackageRequest(package_path=str(package),options=imex.ImportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True)))
        count=preview.card_count()
        if not count:
            raise ValueError('This package does not contain cards.')
        rows=[]
        for nid in preview.db.list('select id from notes limit 5'):
            note=preview.get_note(nid)
            rows.append({k:plain(v) for k,v in preview_fields(note).items()})
        token=uuid.uuid4().hex
        engine(request).pending[token]={'kind':'anki','directory':str(directory),'package':str(package),'created':time.time()}
        return {'token':token,'kind':'anki','count':count,'preview':rows,'warnings':['Sources, explanations and IDs are preserved as note fields. Custom designs and scripts are removed from the imported copy. Cloze, text, images and audio use Recall’s layout. Image occlusion and add-on-dependent interactions may need editing.'],'warningCount':1}
    except Exception as exc:
        shutil.rmtree(directory,ignore_errors=True)
        raise HTTPException(422,f'Anki could not read this package: {str(exc)[:200]}')
    finally:
        if preview:
            preview.close()

@app.post('/api/import/commit')
async def commit(data: CommitInput,request: Request):
    e=engine(request);entry=e.pending.get(data.token)
    if not entry or time.time()-entry['created']>3600:
        raise HTTPException(409,'This preview expired. Preview the import again.')
    if entry['kind']=='text':
        result=e.add_pairs(data.name.strip() or 'Imported cards',entry['rows'])
    else:
        before=e.col.card_count()
        # Keep our scheduling preferences; imported note types and history stay native.
        try:
            e.col.import_anki_package(imex.ImportAnkiPackageRequest(package_path=entry['package'],options=imex.ImportAnkiPackageOptions(with_scheduling=data.scheduling,with_deck_configs=False)))
        except Exception as exc:
            raise HTTPException(422,f'Import failed: {str(exc)[:180]}')
        normalize_designs(e.col)
        result={'added':max(0,e.col.card_count()-before),'skipped':0,'message':'Anki merged the package, including matching notes.'}
        shutil.rmtree(entry['directory'],ignore_errors=True)
        e.invalidate()
    del e.pending[data.token]
    return result

@app.get('/api/export')
async def export(request: Request):
    e=engine(request);directory=Path(tempfile.mkdtemp(prefix='recall-export-'));target=directory/'recall-backup.apkg'
    e.col.export_anki_package(out_path=str(target),options=imex.ExportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True,with_media=True,legacy=False),limit=None)
    return FileResponse(target,filename=f'recall-{datetime.now():%Y-%m-%d}.apkg',media_type='application/octet-stream',background=BackgroundTask(shutil.rmtree,directory))

class SuggestionSettings(BaseModel):
    enabled: bool = True
    split: bool = True
    length: bool = True
    clarity: bool = True
    cloze: bool = True
    source: bool = True

@app.get('/api/suggestions')
async def suggestion_settings(request: Request):
    return SuggestionSettings(**engine(request).col.get_config('recall_suggestions', {})).model_dump()

@app.put('/api/suggestions')
async def save_suggestions(data: SuggestionSettings, request: Request):
    e=engine(request)
    e.col.set_config('recall_suggestions',data.model_dump())
    e.invalidate()
    return data.model_dump()

@app.get('/api/settings')
async def settings(request: Request):
    e=engine(request);config=e.col.decks.get_config(1)
    return {'newPerDay':config['new']['perDay'],'retention':config['desiredRetention'],'fsrs':e.col.get_config('fsrs'),'engine':'26.9.4'}

@app.put('/api/settings')
async def save_settings(data: SettingsInput,request: Request):
    e=engine(request)
    for config in e.col.decks.all_config():
        config['new']['perDay']=data.newPerDay
        config['desiredRetention']=data.retention
        config['new']['bury']=True;config['rev']['bury']=True;config['buryInterdayLearning']=True
        e.col.decks.update_config(config)
    e.invalidate();return {'saved':True}

@app.post('/api/sample')
async def sample(request: Request):
    return engine(request).add_pairs('Learning how to learn · sample',[
        {'front':'What is active recall?','back':'Bringing information to mind before looking at the answer.'},
        {'front':'Why space your study sessions?','back':'Retrieving information across separate sessions helps you retain it over time.'},
        {'front':'What should you choose when you cannot recall an answer?','back':'Again. Hard means you remembered, but with considerable effort.'},
        {'front':'What makes a useful flashcard question?','back':'One clear task with enough context to make the intended answer unambiguous.'},
        {'front':'Does recognising an answer mean you could recall it?','back':'Not necessarily. Try to produce the answer before revealing it.'},
        {'front':'What does a 90% retention target mean?','back':'It is the scheduler’s target probability of recall at review time, not a guarantee.'}])

@app.get('/media/{name:path}')
async def get_media(name: str,request: Request):
    directory=Path(engine(request).col.media.dir()).resolve();path=(directory/name).resolve()
    if path.parent!=directory or not path.is_file() or path.suffix.lower() not in {'.png','.jpg','.jpeg','.gif','.webp','.avif','.mp3','.ogg','.wav','.m4a','.mp4','.webm'}:
        raise HTTPException(404,'Media not available.')
    return FileResponse(path)

if (ROOT/'dist').exists():
    app.mount('/',StaticFiles(directory=ROOT/'dist',html=True),name='web')
