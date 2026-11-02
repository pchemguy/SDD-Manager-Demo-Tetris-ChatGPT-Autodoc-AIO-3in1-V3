"""Assemble a portable unsigned Windows x64 runtime from the pinned official ZIP."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,subprocess,zipfile
from desktop_inventory import validate_application
ROOT=Path(__file__).resolve().parents[1]
def sha(data):return hashlib.sha256(data).hexdigest()
def assemble(runtime,out):
    pin=json.loads((ROOT/'platforms/electron/runtime.json').read_text())
    raw=runtime.read_bytes()
    if len(raw)!=pin['bytes'] or sha(raw)!=pin['sha256']:raise ValueError('Runtime size/SHA-256 does not match the pinned official distribution')
    app=ROOT/'dist/desktop';project=json.loads((ROOT/'package.json').read_text());package=json.loads((app/'package.json').read_text())
    if package['version']!=project['version'] or package['main']!='main.js':raise ValueError('Build the matching desktop application first')
    appfiles={p.relative_to(app).as_posix():p.read_bytes() for p in app.rglob('*') if p.is_file()}
    validate_application(appfiles)
    files={}
    with zipfile.ZipFile(runtime) as z:
        if z.testzip():raise ValueError('Corrupt runtime ZIP')
        if len(z.namelist())!=len(set(z.namelist())):raise ValueError('Duplicate runtime member')
        for info in z.infolist():
            p=PurePosixPath(info.filename)
            if p.is_absolute() or '..' in p.parts or '\\' in info.filename or (info.external_attr>>16)&0o170000==0o120000:raise ValueError('Unsafe runtime member')
            if info.is_dir() or info.filename=='resources/default_app.asar':continue
            name='Tetris.exe' if info.filename=='electron.exe' else info.filename
            files[name]=z.read(info)
    if not {'Tetris.exe','LICENSE','LICENSES.chromium.html','icudtl.dat','version'}<=files.keys():raise ValueError('Incomplete Electron runtime')
    if files['version'].decode().strip()!=pin['version']:raise ValueError('Electron version mismatch')
    for name,data in appfiles.items():files['resources/app/'+name]=data
    metadata={'version':project['version'],'platform':'windows-x64','source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'sourceDirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),'electron':pin}
    files['BUILD-INFO.json']=(json.dumps(metadata,indent=2,sort_keys=True)+'\n').encode()
    files['INSTALL.md']=(ROOT/'INSTALL.md').read_bytes()
    for name,data in files.items():
        if any(mark in data for mark in [b'github_pat_',b'ghp_',b'BEGIN PRIVATE KEY']):raise ValueError('Credential marker in package: '+name)
    out.mkdir(parents=True,exist_ok=True);target=out/'tetris-windows-x64.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for name,data in sorted(files.items()):
            info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    print(json.dumps({'built':str(target),'members':len(files),'bytes':target.stat().st_size,'sha256':sha(target.read_bytes()),'source':metadata['source'],'sourceDirty':metadata['sourceDirty']}),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,default=ROOT/'.cache/electron-runtime/electron-v45.2.1-win32-x64.zip');p.add_argument('--out',type=Path,default=ROOT/'dist/windows-candidate');a=p.parse_args()
    try:assemble(a.runtime,a.out)
    except (ValueError,OSError,KeyError,zipfile.BadZipFile) as error:p.exit(1,str(error)+'\n')
