import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

# Find all fileName: "..." in js_text
files = set(re.findall(r'fileName:\s*["\']([^"\']+)["\']', js_text))

print("Found files in bundle via debug info:")
for fn in sorted(files):
    if 'src/' in fn:
        print(" -", fn)
