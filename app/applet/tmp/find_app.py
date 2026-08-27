import json
import os

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

sc_key = '"sourcesContent":['
idx = text.find(sc_key)
blob = text[idx + len(sc_key):]

# Let's search from the end of blob for App.tsx content markers (like import React or activeView or setActiveView or Feed or Story)
# Let's print snippets from the last 200,000 characters of blob

tail = blob[-200000:]
print("Tail length:", len(tail))

# Let's find occurrences of "import React" or "AppContent" or "activeTab" in tail
import re
for m in re.finditer(r'import\s+React|AppContent|useApp|activeTab|Trading\s+Feed|Feed|Story', tail):
    s = max(0, m.start() - 50)
    e = min(len(tail), m.end() + 100)
    print(f"Match '{m.group(0)}' at {m.start()}:")
    print(repr(tail[s:e]))
    print('-'*40)
