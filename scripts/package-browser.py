"""Build and independently verify the static browser release inventory and ZIP."""
from pathlib import Path, PurePosixPath
import argparse, hashlib, json, re, shutil, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[1]
EXPECTED={'tetris-browser.zip','INSTALL.md','SHA256SUMS.txt'}
def version(): return json.loads((ROOT/'package.json').read_text())['version']
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def verify(folder, extract=None):
    names={p.name for p in folder.iterdir() if p.is_file()}
    if names!=EXPECTED: raise ValueError('Release asset names must be exactly '+', '.join(sorted(EXPECTED)))
    sums={name:sha for sha,name in (line.split('  ',1) for line in (folder/'SHA256SUMS.txt').read_text().splitlines())}
    if set(sums)!=EXPECTED-{'SHA256SUMS.txt'}: raise ValueError('Checksum inventory mismatch')
    for name,sha in sums.items():
        if digest(folder/name)!=sha: raise ValueError('Checksum mismatch: '+name)
    with zipfile.ZipFile(folder/'tetris-browser.zip') as z:
        members=z.namelist()
        if len(set(members))!=len(members) or z.testzip(): raise ValueError('Duplicate/corrupt ZIP member')
        for info in z.infolist():
            p=PurePosixPath(info.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in info.filename or (info.external_attr>>16)&0o170000==0o120000: raise ValueError('Unsafe ZIP member')
            if info.file_size>20_000_000: raise ValueError('Unexpected member size')
            if info.filename not in {'index.html','BUILD-INFO.json','INSTALL.md'} and not (p.parts[0]=='assets' and p.suffix in {'.js','.css','.wasm'}): raise ValueError('Unexpected runtime member: '+info.filename)
            data=z.read(info.filename)
            if any(secret in data for secret in [b'github_pat_',b'ghp_',b'BEGIN PRIVATE KEY']): raise ValueError('Credential marker in runtime')
        if not {'index.html','BUILD-INFO.json','INSTALL.md'}<=set(members): raise ValueError('Missing package entry/metadata/instructions')
        metadata=json.loads(z.read('BUILD-INFO.json'))
        if metadata['version']!=version() or not re.fullmatch('[0-9a-f]{40}',metadata['source']): raise ValueError('Source/version mismatch')
        if metadata['source']!=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(): raise ValueError('Package source does not match selected checkout')
        html=z.read('index.html').decode()
        for url in re.findall(r'(?:src|href)="([^"]+)"',html):
            if not url.startswith('./') or url[2:] not in members: raise ValueError('Missing/nonlocal runtime asset: '+url)
        if z.read('INSTALL.md')!=(folder/'INSTALL.md').read_bytes(): raise ValueError('Installation instructions mismatch')
        if extract:
            if extract.exists(): shutil.rmtree(extract)
            extract.mkdir(parents=True);z.extractall(extract)
    print(json.dumps({'verified':True,'version':version(),'source':metadata['source'],'sourceDirty':metadata['sourceDirty'],'members':len(members),'sha256':digest(folder/'tetris-browser.zip')}))
    return metadata

def package(folder):
    build=ROOT/'dist/browser'
    if not (build/'index.html').is_file(): raise ValueError('Run npm run build first')
    folder.mkdir(parents=True,exist_ok=True)
    metadata={'version':version(),'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceDirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),'platform':'browser'}
    files={str(p.relative_to(build)).replace('\\','/'):p.read_bytes() for p in build.rglob('*') if p.is_file()}
    files['BUILD-INFO.json']=(json.dumps(metadata,sort_keys=True,indent=2)+'\n').encode()
    files['INSTALL.md']=(ROOT/'INSTALL.md').read_bytes()
    with zipfile.ZipFile(folder/'tetris-browser.zip','w',zipfile.ZIP_DEFLATED) as z:
        for name,data in sorted(files.items()):
            info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    (folder/'INSTALL.md').write_bytes(files['INSTALL.md'])
    (folder/'SHA256SUMS.txt').write_text(''.join(digest(folder/n)+'  '+n+'\n' for n in sorted(EXPECTED-{'SHA256SUMS.txt'})))
    verify(folder)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',type=Path,default=ROOT/'dist/release');parser.add_argument('--verify',action='store_true');parser.add_argument('--extract',type=Path);parser.add_argument('--clean-source',action='store_true');args=parser.parse_args()
    try:
        if not args.verify: package(args.out)
        metadata=verify(args.out,args.extract)
        if args.clean_source and metadata['sourceDirty']: raise ValueError('Release requires a clean committed source')
    except (ValueError,KeyError,OSError,zipfile.BadZipFile) as error: parser.exit(1,str(error)+'\n')
