import json
import re

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

sc_key = '"sourcesContent":['
idx = text.find(sc_key)
blob = text[idx + len(sc_key):]

# Let's search for string candidates in blob containing key words:
targets = [
    ('AppContext.tsx', r'export\s+const\s+AppContext|createContext'),
    ('App.tsx', r'export\s+default\s+function\s+App|AppProvider|activeTab'),
    ('Profile.tsx', r'export\s+const\s+Profile|ProfileView|userProfile'),
    ('Journal.tsx', r'export\s+const\s+Journal|weeklyTargetAmount'),
    ('Outlook.tsx', r'export\s+const\s+Outlook|marketAnalysis'),
    ('CreatePost.tsx', r'export\s+const\s+CreatePost|selectedPair'),
    ('PostCard.tsx', r'export\s+const\s+PostCard|likeCount'),
]

for name, pattern in targets:
    matches = list(re.finditer(pattern, blob))
    print(f"=== Target: {name} ({len(matches)} pattern matches) ===")
    for m in matches:
        p = m.start()
        # Find start quote before p
        q_start = blob.rfind('"', 0, p)
        # Find end quote after p
        # search for quote that is followed by , or ]
        q_end = p
        while q_end < len(blob):
            q_end = blob.find('"', q_end + 1)
            if q_end == -1:
                break
            # check backslashes
            b = q_end - 1
            bc = 0
            while b >= 0 and blob[b] == '\\':
                bc += 1
                b -= 1
            if bc % 2 == 0:
                rest = blob[q_end+1:q_end+10].strip()
                if rest.startswith(',') or rest.startswith(']'):
                    break
        
        if q_start != -1 and q_end != -1:
            raw_str = blob[q_start:q_end+1]
            try:
                decoded = json.loads(raw_str, strict=False)
                print(f"  Successfully extracted {name}! Size: {len(decoded)} chars")
                with open(f"/tmp/extracted_{name}", "w", encoding="utf-8") as out:
                    out.write(decoded)
            except Exception as e:
                print(f"  JSON decode failed for {name}: {e}")
