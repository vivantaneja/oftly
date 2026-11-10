import io
import sqlite3
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from anki.collection import Collection
from anki import import_export_pb2 as imex
import server.app as module

HEADERS={'X-Recall-Request':'1'}
@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(module,'DATA',tmp_path/'data')
    with TestClient(module.app,headers=HEADERS) as client:
        yield client

def imported(client,name='Biology',text='Cell\tBasic unit of life\nNucleus\tContains DNA'):
    preview=client.post('/api/import/text/preview',json={'text':text}).json()
    assert preview['count']==2
    response=client.post('/api/import/commit',json={'token':preview['token'],'name':name})
    assert response.status_code==200,response.text
    return response.json()

def test_native_fsrs_review_undo_and_persistence(client):
    imported(client)
    settings=client.get('/api/settings').json()
    assert settings['fsrs'] is True
    response=client.get('/api/study/next').json()
    card=response['card']; assert 'answer' not in card
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':4}).status_code==409
    revealed=client.post('/api/study/reveal',json={'token':card['token']}).json()
    assert len(revealed['intervals'])==4
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':4}).status_code==200
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':4}).status_code==409
    assert client.get('/api/dashboard').json()['stats']['reviewedToday']==1
    # Reads the actual SQLite state written by the native engine.
    with sqlite3.connect(module.DATA/'collection.anki2') as db:
        state=db.execute('select reps,ivl,data from cards where id=?',(card['id'],)).fetchone()
        assert state[0]==1 and state[1]>0 and 's' in state[2]
    assert client.post('/api/study/undo',json={}).status_code==200
    assert client.get('/api/dashboard').json()['stats']['reviewedToday']==0
    restored=client.get('/api/study/next').json()['card']
    assert restored['id']==card['id']

def test_no_early_learning_and_daily_limit(client):
    result=imported(client)
    assert client.put('/api/settings',json={'newPerDay':1,'retention':.9}).status_code==200
    card=client.get('/api/study/next').json()['card']
    client.post('/api/study/reveal',json={'token':card['token']})
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':1}).status_code==200
    assert client.get('/api/study/next').json()['card'] is None
    assert client.get('/api/dashboard').json()['stats']['nextLearningAt'] is not None

def test_queue_counts_waiting_scope_due_and_undo(client):
    result = imported(client, name='Course::Topic')
    other = imported(client, name='Other')
    e = client.app.state.engine
    parent = str(e.col.decks.id('Course'))
    route = '/api/study/next?deck=' + parent
    session = client.get(route).json()
    assert session['queue'] == {'new':2, 'learning':0, 'review':0, 'waiting':0, 'nextLearningAt':None}
    card = session['card']
    client.post('/api/study/reveal', json={'token':card['token']})
    client.post('/api/study/answer', json={'token':card['token'], 'rating':1})
    queue = client.get(route).json()['queue']
    assert (queue['new'], queue['learning'], queue['waiting'], queue['review']) == (1,0,1,0)
    assert queue['nextLearningAt'] > module.time.time()
    decks = client.get('/api/dashboard').json()['decks']
    assert next(d for d in decks if d['id'] == parent)['waiting'] == 1
    assert next(d for d in decks if d['id'] == result['deckId'])['ready'] == 1
    elsewhere = client.get('/api/study/next?deck=' + other['deckId']).json()['queue']
    assert elsewhere['waiting'] == 0 and elsewhere['nextLearningAt'] is None
    # Aggregated parent counts must not double-count the child deck.
    assert client.get('/api/study/next').json()['queue']['new'] == 3
    client.post('/api/study/undo', json={})
    assert client.get(route).json()['queue']['waiting'] == 0
    assert client.get(route).json()['queue']['new'] == 2
    # A genuinely due review belongs in Due, not New or Learning.
    review = e.col.get_card(int(card['id']))
    review.type = 2; review.queue = 2; review.due = e.col.sched.today
    review.ivl = 1; e.col.update_card(review); e.invalidate()
    queue = client.get(route).json()['queue']
    assert (queue['new'], queue['learning'], queue['review']) == (1,0,1)
    e.col.sched.suspend_cards([review.id]); e.invalidate()
    assert client.get(route).json()['queue']['review'] == 0

def test_text_csv_unicode_duplicates_and_errors(client):
    preview=client.post('/api/import/text/preview',json={'text':'Question,Answer\n"Dia duit","Hello, friend"\n"Dia duit","Hello, friend"\nmissing','skipHeader':True}).json()
    assert preview['count']==1 and preview['warningCount']==2
    response=client.post('/api/import/commit',json={'token':preview['token'],'name':'Gaeilge'})
    assert response.json()['added']==1
    assert client.post('/api/import/text/preview',json={'text':'no delimiter'}).status_code==422
    first=imported(client);second=imported(client)
    assert first['added']==2 and second['added']==0 and second['skipped']==2

def test_safe_rendering_and_local_request_boundary(client):
    imported(client,text='One\t<img src="https://example.com/tracker" onerror="alert(1)"><script>alert(2)</script>Answer\nTwo\tSecond')
    card=client.get('/api/study/next').json()['card']
    answer=client.post('/api/study/reveal',json={'token':card['token']}).json()['answer']
    assert '<script' not in answer and 'onerror' not in answer and 'https://' not in answer
    assert client.post('/api/decks',json={'name':'Blocked'},headers={'origin':'https://untrusted.example'}).status_code==403
    assert client.get('/api/dashboard',headers={'host':'untrusted.example'}).status_code==400

def test_imported_html_cannot_style_app_or_load_remote_media():
    cleaned=module.safe_html('<div class="sidebar" style="position:fixed">Fake navigation</div><span class="cloze">Answer</span><img src=https://example.com/tracker.png><audio src="//example.com/tracker.mp3"></audio><img src="diagram.png"><a href="javascript:alert(1)">Source</a>')
    assert 'sidebar' not in cleaned and 'style=' not in cleaned
    assert 'example.com' not in cleaned and 'javascript:' not in cleaned
    assert '<span class="cloze">Answer</span>' in cleaned
    assert 'src="/media/diagram.png"' in cleaned

def test_inner_compression_limits_and_media_storage(tmp_path,monkeypatch):
    import zipfile
    import zstandard
    from server import package_guard
    assert 'src="diagram.png"' in module.stored_html('<img src="diagram.png">')
    assert 'src="/media/diagram.png"' in module.safe_html(module.stored_html('<img src="diagram.png">'))
    package=tmp_path/'compressed.apkg'
    with zipfile.ZipFile(package,'w') as archive:
        archive.writestr('collection.anki21b',zstandard.ZstdCompressor().compress(b'x'*10000))
    monkeypatch.setattr(package_guard,'MAX_EXPANDED',1000)
    with pytest.raises(ValueError,match='Expanded package'):
        package_guard.validate_package(package)

def test_edit_pause_delete(client):
    deck=imported(client)['deckId']
    notes=client.get(f'/api/decks/{deck}/notes').json()['notes'];note=notes[0]
    assert client.put('/api/notes/'+note['id'],json={'deckId':deck,'fields':['Edited','Answer']}).status_code==200
    assert client.post('/api/notes/'+note['id']+'/suspend',json={}).status_code==200
    assert client.get(f'/api/decks/{deck}/notes?q=Edited').json()['notes'][0]['suspended'] is True
    assert client.delete('/api/notes/'+note['id']).status_code==200
    assert client.get(f'/api/decks/{deck}/notes').json()['total']==1

def test_nested_folders_preserve_native_decks_and_review_history(client):
    root=client.post('/api/decks',json={'name':'School','folder':True}).json()['id']
    child=client.post('/api/decks',json={'name':'Science','parentId':root,'folder':True}).json()['id']
    leaf=client.post('/api/decks',json={'name':'Biology','parentId':child}).json()['id']
    client.post('/api/notes',json={'deckId':leaf,'fields':['Cell?','Basic unit of life']})
    # A folder may also contain its own cards; native Anki studies both levels.
    client.post('/api/notes',json={'deckId':child,'fields':['Matter?','Has mass and volume']})
    decks={d['id']:d for d in client.get('/api/dashboard').json()['decks']}
    assert decks[leaf]['name']=='School::Science::Biology'
    assert decks[root]['folder'] and decks[child]['folder'] and not decks[leaf]['folder']
    assert decks[root]['total']==0 and decks[child]['total']==1 and decks[leaf]['total']==1
    assert decks[root]['ready']==2
    card=client.get('/api/study/next',params={'deck':root}).json()['card']
    assert card is not None
    client.post('/api/study/reveal',json={'token':card['token']})
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':4}).status_code==200
    card_id=card['id']
    engine=client.app.state.engine
    before=engine.col.db.all('select id,cid,ease from revlog')
    empty=client.post('/api/decks',json={'name':'Languages','parentId':root,'folder':True}).json()['id']
    assert client.post('/api/decks',json={'name':'Languages','parentId':root}).status_code==409
    assert client.post('/api/decks',json={'name':'Invalid','parentId':'missing'}).status_code==404
    assert client.post('/api/decks',json={'name':'School::::Invalid'}).status_code==422
    engine.close()
    client.app.state.engine=module.Engine(module.DATA)
    reopened=client.app.state.engine
    assert reopened.col.db.all('select id,cid,ease from revlog')==before
    assert reopened.col.get_card(int(card_id)).reps==1
    decks={d['id']:d for d in client.get('/api/dashboard').json()['decks']}
    assert decks[empty]['folder'] and decks[empty]['total']==0

def test_modern_anki_package_cloze_media_and_backup_roundtrip(client,tmp_path):
    source=Collection(str(tmp_path/'source.anki2'))
    did=source.decks.id('Languages::Cloze')
    model=source.models.by_name('Cloze'); note=source.new_note(model)
    note.fields=['The {{c1::mitochondrion}} produces ATP.','<img src="tiny.png">']
    source.add_note(note,did)
    (Path(source.media.dir())/'tiny.png').write_bytes(b'fixture-image')
    package=tmp_path/'native.apkg'
    source.export_anki_package(out_path=str(package),options=imex.ExportAnkiPackageOptions(with_media=True,with_scheduling=True,with_deck_configs=True,legacy=False),limit=None)
    source.close()
    preview=client.post('/api/import/anki/preview',files={'file':('native.apkg',package.read_bytes())})
    assert preview.status_code==200,preview.text
    assert preview.json()['count']==1
    assert client.get('/api/dashboard').json()['stats']['totalCards']==0
    committed=client.post('/api/import/commit',json={'token':preview.json()['token'],'name':'Native','scheduling':True})
    assert committed.status_code==200,committed.text
    card=client.get('/api/study/next').json()['card'];assert 'mitochondrion' not in card['question'] and '[...]' in card['question']
    answer=client.post('/api/study/reveal',json={'token':card['token']}).json()['answer'];assert 'mitochondrion' in answer
    assert client.get('/media/tiny.png').content==b'fixture-image'
    response=client.get('/api/export');assert response.status_code==200,response.text
    backup=tmp_path/'backup.apkg';backup.write_bytes(response.content)
    restored=Collection(str(tmp_path/'restored.anki2'))
    restored.import_anki_package(imex.ImportAnkiPackageRequest(package_path=str(backup),options=imex.ImportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True)))
    assert restored.card_count()==1
    assert (Path(restored.media.dir())/'tiny.png').read_bytes()==b'fixture-image'
    restored.close()

def test_bad_package_is_recoverable(client):
    response=client.post('/api/import/anki/preview',files={'file':('bad.apkg',b'not a zip')})
    assert response.status_code==422
    assert client.get('/api/dashboard').status_code==200


def test_star_mixed_notes_typed_answer_sources_and_duplicates(client, tmp_path):
    batch = {'notes':[
        {'type':'basic','front':'What is RAM?','back':'Random-access memory','source':'Lecture 1','extra':'Working memory','tags':['hardware']},
        {'type':'reversed','front':'bonjour','back':'hello'},
        {'type':'typing','front':'2^5?','back':'32','source':'Lecture 2'},
        {'type':'cloze','front':'{{c1::A}} plus {{c2::B}}','extra':'Two separate targets'}
    ]}
    import json
    response = client.post('/api/import/star/preview',json={'text':json.dumps(batch)})
    assert response.status_code == 200, response.text
    assert response.json()['cards'] == 6
    assert client.get('/api/dashboard').json()['stats']['totalCards'] == 0
    committed = client.post('/api/import/star/commit',json={'name':'Mixed','notes':response.json()['notes']})
    assert committed.status_code == 200, committed.text
    assert committed.json()['cards'] == 6 and committed.json()['added'] == 4
    e = client.app.state.engine
    from server.presentation import present
    typed_id = e.col.find_cards('note:"Anki Star · Type Answer"')[0]
    typed = present(e.col.get_card(typed_id), module.safe_html)
    assert typed['requiresTypedAnswer'] and '32' not in typed['question'] and '[[type:' not in typed['question']
    assert typed['answer'] == '32' and typed['sources'][0]['html'] == 'Lecture 2'
    for cid in e.col.find_cards('note:"Anki Star · Cloze"'):
        view=present(e.col.get_card(cid),module.safe_html)
        assert '[...]' in view['question'] and 'data-cloze=' not in view['question']
        assert view['extras'][0]['html']=='Two separate targets'
    again = client.post('/api/import/star/commit',json={'name':'Another deck','notes':batch['notes']})
    assert again.json()['added'] == 0 and again.json()['skipped'] == 4
    # The native package round-trip retains four fields, note identities, tags and types.
    backup=tmp_path/'star.apkg'; backup.write_bytes(client.get('/api/export').content)
    restored=Collection(str(tmp_path/'star-restored.anki2'))
    restored.import_anki_package(imex.ImportAnkiPackageRequest(package_path=str(backup),options=imex.ImportAnkiPackageOptions(with_scheduling=True)))
    assert restored.card_count()==6
    note=restored.get_note(restored.find_notes('note:"Anki Star · Basic"')[0])
    assert note['Source']=='Lecture 1' and 'hardware' in note.tags
    restored.close()


def test_structured_anki_metadata_and_clean_design_roundtrip(client,tmp_path):
    source=Collection(str(tmp_path/'structured.anki2'))
    model=source.models.new('Senior Cycle CS - Theory Q&A')
    for name in ['ID','Module','Kind','Question','Answer','Extra','Source']:
        source.models.add_field(model,source.models.new_field(name))
    template=source.models.new_template('Theory')
    template['qfmt']='<style>.question{font-size:80px}</style><script>alert(1)</script><div style="color:red">{{ID}} {{Module}} {{Question}}</div>'
    template['afmt']='{{FrontSide}}<hr id=answer>{{Answer}}<div>{{Extra}}</div>{{Source}}'
    source.models.add_template(model,template); model['css']='.card{background:red}'
    source.models.add(model)
    note=source.new_note(model)
    note.fields=['CS-012','Databases','Explain','Why normalise?','Reduce redundancy.','Separate dependent facts.','<a href="https://example.com/lecture">Lecture 3, p. 5</a>']
    source.add_note(note,source.decks.id('Structured'))
    nid=note.id; cid=note.card_ids()[0]
    package=tmp_path/'structured.apkg'
    source.export_anki_package(out_path=str(package),options=imex.ExportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True),limit=None)
    source.close()
    preview=client.post('/api/import/anki/preview',files={'file':('structured.apkg',package.read_bytes())}).json()
    assert preview['preview'][0]['front']=='Why normalise?'
    assert preview['preview'][0]['back']=='Reduce redundancy.'
    assert client.post('/api/import/commit',json={'token':preview['token'],'name':'Structured'}).status_code==200
    card=client.get('/api/study/next').json()['card']
    assert card['question']=='Why normalise?'
    assert 'CS-012' not in card['question'] and 'answer' not in card
    answer=client.post('/api/study/reveal',json={'token':card['token']}).json()
    assert answer['answer']=='Reduce redundancy.'
    assert answer['extras'][0]['html']=='Separate dependent facts.'
    assert 'href="https://example.com/lecture"' in answer['sources'][0]['html']
    assert answer['identity']['noteId']==str(nid) and answer['identity']['cardId']==str(cid)
    assert next(x['html'] for x in answer['details'] if x['label']=='ID')=='CS-012'
    e=client.app.state.engine; imported_model=e.col.models.by_name('Senior Cycle CS - Theory Q&A')
    assert imported_model['css']=='' and '<script' not in imported_model['tmpls'][0]['qfmt'] and 'style=' not in imported_model['tmpls'][0]['qfmt']
    assert e.col.get_note(nid).fields[0]=='CS-012'
    assert client.post('/api/study/answer',json={'token':card['token'],'rating':4}).status_code==200
    assert client.post('/api/study/undo',json={}).status_code==200
    assert e.col.get_note(nid).fields[0]=='CS-012'


def test_star_invalid_batch_is_atomic_and_plain_text_stays_inert(client):
    bad=[{'front':'Valid','back':'Answer'},{'type':'cloze','front':'broken'}]
    assert client.post('/api/import/star/commit',json={'name':'Bad','notes':bad}).status_code==422
    assert client.get('/api/dashboard').json()['stats']['totalCards']==0
    assert client.post('/api/import/star/commit',json={'name':'Literal','notes':[{'front':'<img src=x onerror=alert(1)>','back':'<script>alert(1)</script>[sound:bad.mp3]'}]}).status_code==200
    card=client.get('/api/study/next').json()['card']
    assert '<img ' not in card['question']
    answer=client.post('/api/study/reveal',json={'token':card['token']}).json()['answer']
    assert '<script' not in answer and '<audio' not in answer
    assert client.post('/api/import/star/prompt',json={'context':'Source facts','understanding':True}).json()['prompt'].count('recall::apply')==1


def test_star_rollback_on_collection_failure(client,monkeypatch):
    e=client.app.state.engine
    original=e.col.add_note
    count=0
    def failing(note,did):
        nonlocal count
        count+=1
        if count==2:
            raise RuntimeError('injected failure')
        return original(note,did)
    monkeypatch.setattr(e.col,'add_note',failing)
    with pytest.raises(RuntimeError,match='injected failure'):
        client.post('/api/import/star/commit',json={'name':'Rollback','notes':[{'front':'One','back':'1'},{'front':'Two','back':'2'}]})
    assert e.col.card_count()==0 and e.col.models.by_name('Anki Star · Basic') is None


def test_suggestion_preferences_keep_per_kind_choices_and_card_metadata(client):
    defaults=client.get('/api/suggestions').json()
    assert all(defaults.values())
    preferences={**defaults,'split':False}
    assert client.put('/api/suggestions',json=preferences).json()==preferences
    disabled={**preferences,'enabled':False}
    assert client.put('/api/suggestions',json=disabled).status_code==200
    enabled={**disabled,'enabled':True}
    client.put('/api/suggestions',json=enabled)
    assert client.get('/api/suggestions').json()==preferences
    deck=client.post('/api/decks',json={'name':'Authored'}).json()['id']
    added=client.post('/api/notes',json={'deckId':deck,'fields':['Why normalise?','Reduce redundancy.','Separate dependent facts.','Course notes p. 4']})
    assert added.status_code==200,added.text
    note=client.get(f'/api/decks/{deck}/notes').json()['notes'][0]
    assert note['fieldNames']==['Question','Answer','Extra','Source']
    # Older clients editing two fields cannot erase explanation/source metadata.
    assert client.put('/api/notes/'+note['id'],json={'deckId':deck,'fields':['Edited question?','Edited answer.']}).status_code==200
    saved=client.get(f'/api/decks/{deck}/notes').json()['notes'][0]
    assert saved['fields'][2:]==['Separate dependent facts.','Course notes p. 4']
