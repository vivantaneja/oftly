"""Map Anki fields to a stable web presentation without changing note identity."""
from copy import deepcopy
import re
from anki.template import TemplateRenderContext
from anki.sound import SoundOrVideoTag
import bleach

ALIASES = {
    'question': {'question','front','prompt','term','expression'},
    'answer': {'answer','back','definition','meaning'},
    'extra': {'extra','explanation','explanations','notes','backextra'},
    'source': {'source','sources','reference','references','citation','citations'},
    'identifier': {'id','uid','guid','noteid','cardid','externalid'},
    'property': {'module','kind','topic','chapter','section','unit','category'},
}
def key(name):
    return re.sub(r'[^a-z0-9]', '', name.casefold())

def role(name):
    return next((r for r, aliases in ALIASES.items() if key(name) in aliases), None)

def fields_by_role(note):
    result = {r:[] for r in ALIASES}
    for name, value in note.items():
        if role(name):
            result[role(name)].append((name,value))
    return result

def preview_fields(note):
    groups = fields_by_role(note)
    front = groups['question']
    back = groups['answer']
    if note.note_type()['type'] == 1:
        front = [(n,v) for n,v in note.items() if '{{c' in v] or front
    content = [(n,v) for n,v in note.items() if role(n) not in {'source','extra','identifier','property'}]
    return {'front':(front or content or list(note.items()))[0][1],
            'back':(back or groups['extra'] or content[1:] or [('', '')])[0][1]}

TAGS = ['p','br','div','span','b','strong','i','em','u','s','sub','sup','ul','ol','li','blockquote','pre','code','hr','img','audio','video','source','a','table','thead','tbody','tr','td','th']
def strip_design(template):
    template = re.sub(r'<(script|style|iframe|object)\b[^>]*>.*?</\1>', '', template, flags=re.S|re.I)
    return bleach.clean(template, tags=TAGS, attributes={'img':['src','alt','width','height'],'audio':['src','controls'],'video':['src','controls'],'source':['src','type'],'a':['href','title'],'*':['dir']}, protocols=['http','https','mailto'], strip=True)

def normalize_designs(col):
    """Only the imported copy changes: IDs, note fields, card ordinals and history stay native."""
    for model in col.models.all():
        changed = bool(model.get('css'))
        model['css'] = ''
        for template in model['tmpls']:
            for side in ('qfmt','afmt','bqfmt','bafmt'):
                if side in template:
                    clean = strip_design(template[side])
                    changed |= clean != template[side]
                    template[side] = clean
        if changed:
            col.models.update_dict(model)

def present(card, sanitize):
    note = card.note()
    groups = fields_by_role(note)
    template = deepcopy(card.template())
    qfmt = template['qfmt']
    typed = bool(re.search(r'{{type:', qfmt))
    # Use Anki itself for cloze generation, including repeated and multiple ordinals.
    cloze = re.search(r'{{cloze:([^}]+)}}', qfmt)
    if note.note_type()['type'] == 1 and cloze:
        template['qfmt'] = template['afmt'] = '{{cloze:'+cloze.group(1)+'}}'
    elif groups['question'] and groups['answer']:
        front = groups['question'][0][0]
        back = groups['answer'][0][0]
        refs = [m.split(':')[-1] for m in re.findall(r'{{([^{}#^/]+)}}', qfmt)]
        if back in refs and front not in refs:
            front, back = back, front
        template['qfmt'] = '{{'+front+'}}'
        template['afmt'] = '{{'+back+'}}'
    else:
        # Keep unfamiliar template logic; remove known metadata replacements from the main text.
        metadata = [name for group in ('source','extra','identifier','property') for name,_ in groups[group]]
        for side in ('qfmt','afmt'):
            for name in metadata + ['Tags']:
                template[side] = re.sub(r'{{(?:[^{}:]+:)*'+re.escape(name)+r'}}','',template[side])
        template['afmt'] = re.sub(r'{{FrontSide}}\s*(?:<hr[^>]*>)?', '', template['afmt'], flags=re.I)
    output = TemplateRenderContext.from_card_layout(note,card,note.note_type(),template,False).render()
    def content(text, av):
        def sound(m):
            index = int(m.group(1))
            if index < len(av) and isinstance(av[index], SoundOrVideoTag):
                return '[sound:'+av[index].filename+']'
            return ''
        text = re.sub(r'\[anki:play:[qa]:(\d+)\]', sound, text)
        def type_value(m):
            return note[m.group(1)] if m.group(1) in note else ''
        text = re.sub(r'\[\[type:([^]\n]+)\]\]', type_value, text)
        return sanitize(text)
    def entries(group):
        return [{'label':n,'html':sanitize(v)} for n,v in groups[group] if v.strip()]
    return {'question':content(output.question_text,output.question_av_tags),
            'answer':content(output.answer_text,output.answer_av_tags),
            'requiresTypedAnswer':typed,
            'extras':entries('extra'),'sources':entries('source'),
            'details':entries('property')+entries('identifier'),
            'identity':{'noteId':str(note.id),'cardId':str(card.id),'noteType':note.note_type()['name']},
            'tags':list(note.tags)}
