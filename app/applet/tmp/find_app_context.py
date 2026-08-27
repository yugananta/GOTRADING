import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

# Let's search for AppContext or AppProvider in js_text
for m in re.finditer(r'AppProvider|createContext|pendingConnections|tradingStats|viewUserProfile', js_text):
    s = max(0, m.start() - 200)
    e = min(len(js_text), m.end() + 500)
    print(f"=== MATCH for {m.group(0)} at {m.start()} ===")
    print(js_text[s:e])
    print('-'*50)
