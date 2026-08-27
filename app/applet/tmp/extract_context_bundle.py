import re

with open('/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js', 'r', encoding='utf-8', errors='ignore') as f:
    js_text = f.read()

# AppContext starts around 396000 and ends around 403000
app_context_snippet = js_text[396100:403000]

with open('/tmp/reconstructed_AppContext_bundle.txt', 'w', encoding='utf-8') as out:
    out.write(app_context_snippet)

print("Saved AppContext bundle section! Size:", len(app_context_snippet))
