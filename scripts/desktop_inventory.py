"""Closed inventory contract for the generated Electron application directory."""
import json,re
REQUIRED={'main.js','package.json','LICENSE','THIRD-PARTY-NOTICES.txt','INSTALL.md','renderer/index.html','renderer/ASSETS.json','renderer/schemas/snapshot.schema.json'}
def validate_application(files):
    names=set(files)
    if not REQUIRED<=names:raise ValueError('Missing required desktop application entry or notice')
    if any(n not in REQUIRED and not re.fullmatch(r'renderer/assets/[A-Za-z0-9][A-Za-z0-9_.-]*\.(?:js|css|wasm)',n) for n in names):raise ValueError('Unexpected development or application file')
    for pattern in [r'renderer/assets/codec\.worker-[A-Za-z0-9_-]+\.js',r'renderer/assets/sql-wasm-browser-[A-Za-z0-9_-]+\.wasm']:
        if sum(bool(re.fullmatch(pattern,n)) for n in names)!=1:raise ValueError('Expected one bundled codec worker and SQLite WASM')
    if not any(n.endswith('.css') for n in names):raise ValueError('Missing renderer styles')
    try:package=json.loads(files['package.json'])
    except (ValueError,TypeError,UnicodeError) as error:raise ValueError('Invalid desktop manifest') from error
    if not isinstance(package,dict) or set(package)-{'name','productName','version','type','main'} or package.get('main')!='main.js' or package.get('type')!='module':raise ValueError('Invalid desktop main/type or dependency metadata')
