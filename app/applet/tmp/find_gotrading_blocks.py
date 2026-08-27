import json
import re

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

sc_key = '"sourcesContent":['
idx = text.find(sc_key)
blob = text[idx + len(sc_key):]

keywords = [
    "Tarapti",
    "GoTrading",
    "setActiveView",
    "activeView",
    "setPosts",
    "postFeed",
    "Story",
    "Leaderboard",
    "Notifications",
    "Messages",
    "LanguageSelector",
    "UserProfile",
    "Account",
    "ConnectModal",
    "GroupView",
    "AdminPortal",
    "RealtimeNotification",
    "useLocationCascade",
    "MetaTrader",
]

found_strings = {}

for kw in keywords:
    matches = list(re.finditer(re.escape(kw), blob))
    print(f"Keyword '{kw}': {len(matches)} matches in blob")
    for m in matches[:5]:
        p = m.start()
        # Find start quote of string
        # We find previous unescaped quote
        q_start = -1
        check_pos = p
        while check_pos > 0:
            check_pos = blob.rfind('"', 0, check_pos)
            if check_pos == -1:
                break
            # check if escaped
            b = check_pos - 1
            bc = 0
            while b >= 0 and blob[b] == '\\':
                bc += 1
                b -= 1
            if bc % 2 == 0:
                q_start = check_pos
                break
        
        # Find end quote
        q_end = -1
        search_pos = p
        while search_pos < len(blob):
            search_pos = blob.find('"', search_pos + 1)
            if search_pos == -1:
                break
            b = search_pos - 1
            bc = 0
            while b >= 0 and blob[b] == '\\':
                bc += 1
                b -= 1
            if bc % 2 == 0:
                rest = blob[search_pos+1:search_pos+10].strip()
                if rest.startswith(',') or rest.startswith(']'):
                    q_end = search_pos
                    break
        
        if q_start != -1 and q_end != -1:
            raw = blob[q_start:q_end+1]
            try:
                dec = json.loads(raw, strict=False)
                key = (q_start, q_end)
                if key not in found_strings:
                    found_strings[key] = (kw, dec)
            except Exception as e:
                pass

print(f"\nExtracted {len(found_strings)} unique source string blocks from map!")

import os
os.makedirs('/tmp/extracted_gotrading', exist_ok=True)
for i, (key, (kw, content)) in enumerate(found_strings.items()):
    # try to identify file
    first_line = content.split('\n')[0] if content else ""
    snippet = content[:100].replace('\n', ' ')
    filename = f"block_{i}_{kw}.tsx"
    if 'export const AppContext' in content or 'createContext' in content and 'currentUser' in content:
        filename = "AppContext.tsx"
    elif 'export function App' in content or 'export default function App' in content or 'activeView' in content:
        filename = "App.tsx"
    elif 'export const Journal' in content or 'weeklyTarget' in content:
        filename = "Journal.tsx"
    elif 'export const Outlook' in content or 'marketAnalysis' in content:
        filename = "Outlook.tsx"
    
    out_path = f"/tmp/extracted_gotrading/{filename}"
    with open(out_path, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"Saved {filename} ({len(content)} chars): {snippet}...")
