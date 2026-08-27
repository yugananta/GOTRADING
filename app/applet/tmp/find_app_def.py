import json
import re

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

sc_key = '"sourcesContent":['
idx = text.find(sc_key)
blob = text[idx + len(sc_key):]

# Let's search for all JSON strings in blob that contain "export default function App" or "export const AppContext" or "const App"
for m in re.finditer(r'"[^"]*export\s+(default\s+function|const)\s+App[^"]*"', blob):
    s = m.start()
    e = m.end()
    print("Found candidate App definition! Length:", e - s)
    val = blob[s:e]
    try:
        decoded = json.loads(val, strict=False)
        print("Decoded App.tsx! Preview:")
        print(decoded[:300])
        print("...")
        print(decoded[-300:])
        with open('/tmp/extracted_App.tsx', 'w') as out:
            out.write(decoded)
        print("Saved to /tmp/extracted_App.tsx")
    except Exception as err:
        print("Decode error:", err)
