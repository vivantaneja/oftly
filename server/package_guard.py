"""Bound ZIP and inner Zstandard expansion before native Anki reads an APKG."""
import zipfile
import zstandard

MAX_EXPANDED = 250 * 1024 * 1024

def validate_package(path):
    with zipfile.ZipFile(path) as archive:
        entries=archive.infolist()
        names=[entry.filename for entry in entries]
        if len(entries)>15000 or len(names)!=len(set(names)) or any('/' in name or '\\' in name or name=='..' for name in names):
            raise ValueError('Package has too many entries or invalid filenames.')
        if sum(entry.file_size for entry in entries)>MAX_EXPANDED:
            raise ValueError('Expanded package exceeds 250 MB.')
        modern='collection.anki21b' in names
        expanded=0
        for entry in entries:
            with archive.open(entry) as source:
                compressed=modern and (entry.filename in {'collection.anki21b','media'} or entry.filename.isdigit())
                # The installed binding forwards this directly to ZSTD_DCtx_setMaxWindowSize (bytes).
                stream=zstandard.ZstdDecompressor(max_window_size=64*1024*1024).stream_reader(source,read_across_frames=True) if compressed else source
                try:
                    while chunk:=stream.read(65536):
                        expanded+=len(chunk)
                        if expanded>MAX_EXPANDED:
                            raise ValueError('Expanded package exceeds 250 MB, including compressed media.')
                finally:
                    if compressed:
                        stream.close()
