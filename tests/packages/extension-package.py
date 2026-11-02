"""Exercise the real producer/verifier and hostile archive mutations."""
from pathlib import Path
import importlib.util,tempfile,zipfile,json,sys
spec=importlib.util.spec_from_file_location('extension',Path('scripts/package-extension.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
platform=sys.argv[1] if len(sys.argv)>1 else 'chromium'
with tempfile.TemporaryDirectory() as tmp:
    folder=Path(tmp);archive=folder/f'tetris-{platform}.zip';m.package(platform,folder);m.verify(platform,archive,False,folder/'extracted')
    assert (folder/'extracted/sidebar.html').is_file()
    renamed=folder/f'tetris-{platform}-v1.zip';renamed.write_bytes(archive.read_bytes())
    try:m.verify(platform,renamed)
    except ValueError:pass
    else:raise AssertionError('accepted unstable archive basename')
    with zipfile.ZipFile(archive) as z:original={n:z.read(n) for n in z.namelist()}
    mutations=[{'../escape':b'bad'},{'unexpected.txt':b'bad'},{'manifest.json':b'{}'},{'BUILD-INFO.json':json.dumps({**json.loads(original['BUILD-INFO.json']),'source':'0'*40}).encode()},{'background.js':b'github_pat_forbidden'}, {'icons/tetris-16.png':b'broken'}]
    for changes in mutations:
        files={**original,**changes}
        with zipfile.ZipFile(archive,'w') as z:
            for n,v in files.items():z.writestr(n,v)
        try:m.verify(platform,archive)
        except (ValueError,KeyError):pass
        else:raise AssertionError('accepted invalid package '+str(changes.keys()))
    print(json.dumps({'validExtraction':True,'mutationsRejected':len(mutations)}))
