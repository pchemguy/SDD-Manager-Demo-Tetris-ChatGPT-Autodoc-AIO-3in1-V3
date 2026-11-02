"""Fetch the pinned public Windows runtime and require its reviewed byte identity."""
from pathlib import Path
import json,hashlib,urllib.request
ROOT=Path(__file__).resolve().parents[1];pin=json.loads((ROOT/'platforms/electron/runtime.json').read_text());folder=ROOT/'.cache/electron-runtime';folder.mkdir(parents=True,exist_ok=True);target=folder/pin['asset']
if not target.exists() or target.stat().st_size!=pin['bytes'] or hashlib.sha256(target.read_bytes()).hexdigest()!=pin['sha256']:
    temporary=target.with_suffix('.download')
    try:
        with urllib.request.urlopen(pin['url'],timeout=60) as response,temporary.open('wb') as out:
            while chunk:=response.read(1024*1024):out.write(chunk)
        if temporary.stat().st_size!=pin['bytes'] or hashlib.sha256(temporary.read_bytes()).hexdigest()!=pin['sha256']:raise ValueError('Downloaded runtime identity mismatch')
        temporary.replace(target)
    finally:temporary.unlink(missing_ok=True)
print('Pinned official Electron runtime size and SHA-256 verified',flush=True)
