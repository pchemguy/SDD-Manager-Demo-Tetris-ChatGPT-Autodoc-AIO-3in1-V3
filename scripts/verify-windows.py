"""Independently inspect the actual portable ZIP and its pristine pinned runtime."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,struct,subprocess,zipfile,shutil
ROOT=Path(__file__).resolve().parents[1]
def digest(data):return hashlib.sha256(data).hexdigest()
def verify(archive,runtime,extract=None):
    pin=json.loads((ROOT/'platforms/electron/runtime.json').read_text());data=runtime.read_bytes()
    if len(data)!=pin['bytes'] or digest(data)!=pin['sha256']:raise ValueError('Pinned runtime identity mismatch')
    if archive.name!='tetris-windows-x64.zip':raise ValueError('Windows asset must use its stable name')
    with zipfile.ZipFile(runtime) as original,zipfile.ZipFile(archive) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or len(names)!=len(set(n.casefold() for n in names)):raise ValueError('Duplicate/case-colliding package member')
        if z.testzip():raise ValueError('Package CRC failure')
        for info in z.infolist():
            p=PurePosixPath(info.filename)
            if p.is_absolute() or '..'in p.parts or '\\'in info.filename or ':'in info.filename or info.is_dir() or (info.external_attr>>16)&0o170000==0o120000:raise ValueError('Unsafe package member')
        expected={('Tetris.exe' if n=='electron.exe' else n) for n in original.namelist() if not n.endswith('/') and n!='resources/default_app.asar'}
        app=ROOT/'dist/desktop';appfiles={p.relative_to(app).as_posix():p for p in app.rglob('*') if p.is_file()}
        expected|={'resources/app/'+n for n in appfiles};expected|={'BUILD-INFO.json','INSTALL.md'}
        if set(names)!=expected:raise ValueError('Runtime/application inventory mismatch')
        for info in original.infolist():
            if info.is_dir() or info.filename=='resources/default_app.asar':continue
            name='Tetris.exe' if info.filename=='electron.exe' else info.filename
            if digest(z.read(name))!=digest(original.read(info)):raise ValueError('Pristine runtime byte mismatch: '+name)
        for name,path in appfiles.items():
            if z.read('resources/app/'+name)!=path.read_bytes():raise ValueError('Application/source mismatch: '+name)
        exe=z.read('Tetris.exe');offset=struct.unpack_from('<I',exe,0x3c)[0]
        if exe[:2]!=b'MZ' or exe[offset:offset+4]!=b'PE\0\0' or struct.unpack_from('<H',exe,offset+4)[0]!=0x8664 or struct.unpack_from('<H',exe,offset+24)[0]!=0x20b:raise ValueError('Expected AMD64 PE32+ executable')
        meta=json.loads(z.read('BUILD-INFO.json'));project=json.loads((ROOT/'package.json').read_text());package=json.loads(z.read('resources/app/package.json'))
        if type(meta.get('sourceDirty')) is not bool:raise ValueError('Invalid source cleanliness metadata')
        if meta['version']!=project['version'] or package['version']!=project['version'] or meta['platform']!='windows-x64' or meta['electron']!=pin:raise ValueError('Package version/platform/runtime metadata mismatch')
        if meta['source']!=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip():raise ValueError('Package source mismatch')
        if z.read('INSTALL.md')!=(ROOT/'INSTALL.md').read_bytes():raise ValueError('Instructions/source mismatch')
        manifest=json.loads(z.read('resources/app/renderer/ASSETS.json'))
        resources={n.removeprefix('resources/app/renderer/'):digest(z.read(n)) for n in names if n.startswith('resources/app/renderer/') and not n.endswith('/ASSETS.json')}
        if manifest!={'formatVersion':1,'files':resources}:raise ValueError('Renderer manifest mismatch')
        for n in names:
            if any(mark in z.read(n) for mark in [b'github_pat_',b'ghp_',b'BEGIN PRIVATE KEY']):raise ValueError('Secret marker: '+n)
        if extract:
            if extract.exists():shutil.rmtree(extract)
            extract.mkdir(parents=True);z.extractall(extract)
    print(json.dumps({'verified':True,'platform':'windows-x64','nativeExecution':False,'members':len(names),'version':meta['version'],'source':meta['source'],'sourceDirty':meta['sourceDirty'],'sha256':digest(archive.read_bytes())}),flush=True)
    return meta
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--archive',type=Path,default=ROOT/'dist/windows-candidate/tetris-windows-x64.zip');p.add_argument('--runtime',type=Path,default=ROOT/'.cache/electron-runtime/electron-v45.2.1-win32-x64.zip');p.add_argument('--extract',type=Path);p.add_argument('--clean-source',action='store_true');a=p.parse_args()
    try:
        m=verify(a.archive,a.runtime,a.extract)
        if a.clean_source and (m['sourceDirty'] or subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()):raise ValueError('Release requires clean committed source')
    except (ValueError,OSError,KeyError,zipfile.BadZipFile,struct.error) as error:p.exit(1,str(error)+'\n')
