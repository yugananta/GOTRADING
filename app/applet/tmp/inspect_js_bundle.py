import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

print("index-DAGJp1WC.js size:", len(js_text))

# Let's search for Trading Feed, Post Box, Story bar, etc. in js_text
patterns = [
    'Trading',
    'Feed',
    'Story',
    'Post',
    'Cerita',
    'PostCard',
    'CreatePost',
    'weeklyTarget',
    'Outlook',
    'Journal',
    'Connect',
    'Profile'
]

for p in patterns:
    matches = list(re.finditer(p, js_text, re.IGNORECASE))
    print(f"Pattern '{p}': {len(matches)} matches")

# Let's print snippets around 'Cerita' or 'Trading' or 'Post'
for m in re.finditer(r'Cerita|Trading|weeklyTarget|PostCard', js_text):
    s = max(0, m.start() - 100)
    e = min(len(js_text), m.end() + 200)
    print(f"=== SNIPPET for {m.group(0)} at {m.start()} ===")
    print(js_text[s:e])
    print('-'*40)
