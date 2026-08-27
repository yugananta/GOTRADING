import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

# Find occurrences of fileName:"/app/applet/src/App.tsx"
matches = list(re.finditer(r'fileName:\s*["\']/app/applet/src/App\.tsx["\']', js_text))
print("Found App.tsx JSX elements in bundle:", len(matches))

if matches:
    first = matches[0].start()
    last = matches[-1].end()
    s = max(0, first - 1000)
    e = min(len(js_text), last + 1000)
    
    snippet = js_text[s:e]
    print("=== APP.TSX CODE SNIPPET FROM BUNDLE ===")
    print(snippet[:3000])
