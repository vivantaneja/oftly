"""Synthetic packages only; never opens the developer's actual collection."""
from pathlib import Path
import base64, tempfile
from server.app import Engine
from anki import import_export_pb2 as imex
target=Path('.impeccable/review/security').resolve()
target.mkdir(parents=True,exist_ok=True)
engine=Engine(Path(tempfile.mkdtemp(prefix='oftly-package-test-')))
engine.add_pairs('School::Biology',[
    {'front':'What is a cell?','back':'The basic unit of life.<img src="diagram.png">','source':'Biology textbook, p. 4','extra':'Cells carry out life processes.'},
    {'front':'Where is DNA stored?','back':'The nucleus.'},
])
for nid in engine.col.db.list('select id from notes'):
    note=engine.col.get_note(nid)
    note.fields=[field.replace('/media/diagram.png','diagram.png') for field in note.fields]
    engine.col.update_note(note)
Path(engine.col.media.dir(),'diagram.png').write_bytes(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII='))
for legacy in (True,False):
    engine.col.export_anki_package(out_path=str(target/('legacy.apkg' if legacy else 'modern.apkg')),options=imex.ExportAnkiPackageOptions(with_scheduling=True,with_deck_configs=True,with_media=True,legacy=legacy),limit=None)
engine.close()
