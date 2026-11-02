"""Produce and verify the cumulative stable-name browser and Windows release inventory."""
from pathlib import Path
import argparse,hashlib,json,subprocess,tempfile,shutil
ROOT=Path(__file__).resolve().parents[1]
NAMES={'tetris-browser.zip','tetris-windows-x64.zip','INSTALL.md','SHA256SUMS.txt'}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def call(*args):subprocess.run(['python',*map(str,args)],cwd=ROOT,check=True)
def verify(folder,clean=False,extract=False):
    if {p.name for p in folder.iterdir()}!=NAMES or not all((folder/n).is_file() for n in NAMES):raise ValueError('Cumulative release asset-name inventory mismatch')
    lines=(folder/'SHA256SUMS.txt').read_text().splitlines();sums={}
    for line in lines:
        digest,name=line.split('  ',1)
        if name in sums or name not in NAMES-{'SHA256SUMS.txt'} or digest!=sha(folder/name):raise ValueError('Duplicate, unknown or incorrect checksum')
        sums[name]=digest
    if set(sums)!=NAMES-{'SHA256SUMS.txt'}:raise ValueError('Incomplete checksum inventory')
    flags=['--clean-source'] if clean else []
    with tempfile.TemporaryDirectory() as tmp:
        stage=Path(tmp)
        for n in ['tetris-browser.zip','INSTALL.md']:shutil.copyfile(folder/n,stage/n)
        (stage/'SHA256SUMS.txt').write_text(''.join(sums[n]+'  '+n+'\n' for n in sorted(['tetris-browser.zip','INSTALL.md'])))
        call('scripts/package-browser.py','--verify','--out',stage,*flags,*(['--extract',ROOT/'dist/package-smoke'] if extract else []))
    call('scripts/verify-windows.py','--archive',folder/'tetris-windows-x64.zip',*flags,*(['--extract',ROOT/'dist/windows-smoke'] if extract else []))
    print(json.dumps({'releaseInventory':sorted(NAMES),'verified':True,'sha256':sums}),flush=True)
def package(folder):
    if folder.exists():shutil.rmtree(folder)
    folder.mkdir(parents=True)
    with tempfile.TemporaryDirectory() as tmp:
        browser=Path(tmp)/'browser';windows=Path(tmp)/'windows'
        call('scripts/package-browser.py','--out',browser);call('scripts/package-windows.py','--out',windows)
        for name in ['tetris-browser.zip','INSTALL.md']:shutil.copyfile(browser/name,folder/name)
        shutil.copyfile(windows/'tetris-windows-x64.zip',folder/'tetris-windows-x64.zip')
    (folder/'SHA256SUMS.txt').write_text(''.join(sha(folder/n)+'  '+n+'\n' for n in sorted(NAMES-{'SHA256SUMS.txt'})))
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',type=Path,default=ROOT/'dist/release');p.add_argument('--verify',action='store_true');p.add_argument('--clean-source',action='store_true');p.add_argument('--extract',action='store_true');a=p.parse_args()
    try:
        if not a.verify:package(a.out)
        verify(a.out,a.clean_source,a.extract)
    except (ValueError,OSError,KeyError,subprocess.CalledProcessError) as error:p.exit(1,str(error)+'\n')
