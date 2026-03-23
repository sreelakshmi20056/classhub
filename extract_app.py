import json, os

path = r"c:\Users\Sreelakhmi\Desktop\classhub\frontend\build\static\js"

maps = [f for f in os.listdir(path) if f.endswith('.map')]
for m in maps:
    full = os.path.join(path, m)
    try:
        with open(full, 'r', encoding='utf-8', errors='ignore') as f:
            data = json.load(f)
    except Exception as e:
        print('Failed to load', full, e)
        continue

    if 'sources' in data:
        for i, s in enumerate(data['sources']):
            if s.endswith('App.js'):
                print('Found in', m, 'index', i, 'source', s)
                if 'sourcesContent' in data and data['sourcesContent'][i]:
                    out = r"c:\Users\Sreelakhmi\Desktop\classhub\frontend\src\App_extracted.js"
                    with open(out, 'w', encoding='utf-8') as fout:
                        fout.write(data['sourcesContent'][i])
                    print('Extracted to', out)
                break
