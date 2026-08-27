import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

# Find start of App component: search for fileName:"/app/applet/src/App.tsx",lineNumber:434
matches = list(re.finditer(r'fileName:\s*["\']/app/applet/src/App\.tsx["\']', js_text))
print("Total App.tsx matches:", len(matches))

first_pos = matches[0].start()
last_pos = matches[-1].end()

# Let's extract the full block around App.tsx
start_idx = max(0, first_pos - 3000)
end_idx = min(len(js_text), last_pos + 3000)

full_app_code = js_text[start_idx:end_idx]

with open('/tmp/full_app_bundle.js', 'w', encoding='utf-8') as out:
    out.write(full_app_code)

print("Saved full app bundle section to /tmp/full_app_bundle.js. Size:", len(full_app_code))
