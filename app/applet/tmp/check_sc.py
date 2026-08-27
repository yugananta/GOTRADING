import json
import re

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

sc_idx = text.find('sourcesContent')
print("Found 'sourcesContent' at index:", sc_idx)

if sc_idx != -1:
    blob = text[sc_idx:]
    print("blob starts with:", repr(blob[:50]))
    
    keywords = ["Tarapti", "GoTrading", "setActiveView", "activeView", "posts", "Story", "Leaderboard", "Notifications", "Journal", "Outlook", "Profile", "Account"]
    for kw in keywords:
        m = list(re.finditer(re.escape(kw), blob))
        print(f"Keyword '{kw}': {len(m)} matches in blob")
