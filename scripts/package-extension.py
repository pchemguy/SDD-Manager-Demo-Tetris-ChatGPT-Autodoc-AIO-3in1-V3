"""Build and independently verify the local Chromium development extension ZIP."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,zipfile,subprocess,shutil,importlib.util,re
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('browser',ROOT/'scripts/package-browser.py');browser=importlib.util.module_from_spec(spec);spec.loader.exec_module(browser)
def sha(data):return hashlib.sha256(data).hexdigest()
def identity():return json.loads((ROOT/'package.json').read_text())['version'],subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
def required(platform):
    if platform!='chromium':raise ValueError('Unsupported extension target')
    manifest=json.loads((ROOT/f'platforms/{platform}/manifest.json').read_text())
    return manifest,{'sidebar.html','background.js','manifest.json','INSTALL.md','LICENSE','THIRD-PARTY-NOTICES.txt','schemas/snapshot.schema.json',*manifest['icons'].values()}
def verify(platform,archive,clean=False,extract=None):
    expected,base=required(platform);version,source=identity()
    if archive.name!=f'tetris-{platform}.zip':raise ValueError('Extension archive must use the stable platform basename')
    with zipfile.ZipFile(archive) as z:
        names=z.namelist()
        if len(set(names))!=len(names) or z.testzip():raise ValueError('Duplicate/corrupt extension archive')
        files={}
        for info in z.infolist():
            name=info.filename;p=PurePosixPath(name)
            if p.is_absolute() or '..' in p.parts or '\\' in name or (info.external_attr>>16)&0o170000==0o120000 or info.file_size>20_000_000:raise ValueError('Unsafe extension member')
            if name not in base|{'BUILD-INFO.json'} and not re.fullmatch(r'assets/(?:index-[A-Za-z0-9_-]+\.(?:js|css)|codec\.worker-[A-Za-z0-9_-]+\.js|sql-wasm-browser-[A-Za-z0-9_-]+\.wasm)',name):raise ValueError('Unexpected extension member '+name)
            data=z.read(name)
            if any(s in data for s in [b'github_pat_',b'ghp_',b'BEGIN PRIVATE KEY']):raise ValueError('Credential marker in extension')
            files[name]=data
        if not base|{'BUILD-INFO.json'}<=set(files):raise ValueError('Incomplete extension roots')
        meta=json.loads(files['BUILD-INFO.json'])
        if set(meta)!={'formatVersion','version','source','sourceDirty','platform','sqlite','assets'} or meta['formatVersion']!=1 or meta['version']!=version or meta['source']!=source or meta['platform']!=platform or type(meta['sourceDirty']) is not bool or clean and meta['sourceDirty']:raise ValueError('Extension source/version/clean identity mismatch')
        if meta['assets']!={n:sha(data) for n,data in files.items() if n!='BUILD-INFO.json'}:raise ValueError('Extension asset fingerprint/inventory mismatch')
        if json.loads(files['manifest.json'])!=expected or expected['version']!=version:raise ValueError('Extension manifest/source mismatch')
        if meta['sqlite']!=browser.sqlite_assets():raise ValueError('Extension SQLite source mismatch')
        for name in ['LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md','schemas/snapshot.schema.json']:
            if files[name]!=(ROOT/name).read_bytes():raise ValueError('Extension notice/schema/instructions mismatch')
        for name in expected['icons'].values():
            if files[name]!=(ROOT/'platforms'/name).read_bytes() or files[name][:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Extension icon mismatch')
        html=files['sidebar.html'].decode();refs=re.findall(r'(?:src|href)="([^"]+)"',html)
        if len(refs)!=2 or any(not r.startswith('./assets/') or r[2:] not in files for r in refs) or re.search(r'<script[^>]*>\s*[^<\s]',html):raise ValueError('Invalid/nonlocal sidebar entry')
        workers=[n for n in files if re.fullmatch(r'assets/codec\.worker-[A-Za-z0-9_-]+\.js',n)];wasm=[n for n in files if n.endswith('.wasm')]
        main=[n for n in files if re.fullmatch(r'assets/index-[A-Za-z0-9_-]+\.js',n)];css=[n for n in files if n.endswith('.css')]
        if any(len(items)!=1 for items in [workers,wasm,main,css]) or len(files)!=len(base)+5:raise ValueError('Extension runtime inventory mismatch')
        if PurePosixPath(workers[0]).name not in files[main[0]].decode() or PurePosixPath(wasm[0]).name not in files[workers[0]].decode() or sha(files[wasm[0]])!=meta['sqlite']['hashes']['sql-wasm-browser.wasm']:raise ValueError('Unreferenced or wrong worker/WASM')
        for name in [*main,*workers,'background.js']:
            if re.search(rb'\b(?:eval\s*\(|new\s+Function\s*\(|require\([\x22\x27]electron)|[\x22\x27\x60]node:',files[name]):raise ValueError('Disallowed runtime execution dependency')
        if extract:
            if extract.exists():shutil.rmtree(extract)
            extract.mkdir(parents=True);z.extractall(extract)
    print(json.dumps({'extension':platform,'verified':True,'version':version,'source':source,'sourceDirty':meta['sourceDirty'],'members':len(files),'sha256':browser.digest(archive)}),flush=True)
    return meta

def package(platform,folder):
    required(platform);build=ROOT/'dist'/platform;version,source=identity()
    files={p.relative_to(build).as_posix():p.read_bytes() for p in build.rglob('*') if p.is_file()}
    files.pop('BUILD-INFO.json',None)
    meta={'formatVersion':1,'version':version,'source':source,'sourceDirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),'platform':platform,'sqlite':browser.sqlite_assets(),'assets':{n:sha(data) for n,data in files.items()}}
    files['BUILD-INFO.json']=(json.dumps(meta,sort_keys=True,indent=2)+'\n').encode();folder.mkdir(parents=True,exist_ok=True);archive=folder/f'tetris-{platform}.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for name,data in sorted(files.items()):
            info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data)
    verify(platform,archive)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--platform',choices=['chromium'],default='chromium');p.add_argument('--out',type=Path,default=ROOT/'dist/extension-candidate');p.add_argument('--archive',type=Path);p.add_argument('--verify',action='store_true');p.add_argument('--clean-source',action='store_true');p.add_argument('--extract',type=Path);a=p.parse_args()
    try:
        if not a.verify:package(a.platform,a.out)
        verify(a.platform,a.archive or a.out/f'tetris-{a.platform}.zip',a.clean_source,a.extract)
    except (ValueError,KeyError,OSError,zipfile.BadZipFile) as error:p.exit(1,str(error)+'\n')
