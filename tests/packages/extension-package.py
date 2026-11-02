"""Exercise the real producer/verifier and hostile archive mutations."""
from pathlib import Path
import importlib.util,tempfile,zipfile,json
spec=importlib.util.spec_from_file_location('extension',Path('scripts/package-extension.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
    folder=Path(tmp);archive=folder/'tetris-chromium.zip';m.package('chromium',folder);m.verify('chromium',archive,False,folder/'extracted')
    assert (folder/'extracted/sidebar.html').is_file()
    renamed=folder/'tetris-chromium-v1.zip';renamed.write_bytes(archive.read_bytes())
    try:m.verify('chromium',renamed)
    except ValueError:pass
    else:raise AssertionError('accepted unstable archive basename')
    with zipfile.ZipFile(archive) as z:original={n:z.read(n) for n in z.namelist()}
    mutations=[{'../escape':b'bad'},{'unexpected.txt':b'bad'},{'manifest.json':b'{}'},{'BUILD-INFO.json':json.dumps({**json.loads(original['BUILD-INFO.json']),'source':'0'*40}).encode()},{'background.js':b'github_pat_forbidden'}, {'icons/tetris-16.png':b'broken'}]
    for changes in mutations:
        files={**original,**changes}
        with zipfile.ZipFile(archive,'w') as z:
            for n,v in files.items():z.writestr(n,v)
        try:m.verify('chromium',archive)
        except (ValueError,KeyError):pass
        else:raise AssertionError('accepted invalid package '+str(changes.keys()))
    print(json.dumps({'validExtraction':True,'mutationsRejected':len(mutations)}))
