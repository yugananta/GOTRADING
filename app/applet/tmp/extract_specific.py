import json
import os
import re

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Extract sources list
s_idx = text.find('"sources":[' + '"')
if s_idx == -1:
    s_idx = text.find('"sources": [')
sc_idx = text.find('"sourcesContent":[' + '"')
if sc_idx == -1:
    sc_idx = text.find('"sourcesContent": [')

sources_json_str = text[text.find('[', s_idx):text.find(']', s_idx)+1]
sources = json.loads(sources_json_str)

print("Total sources in map:", len(sources))

blob = text[sc_idx + len('"sourcesContent":['):]

# Let's locate each source file by searching its unique imports/exports or by splitting the blob cleanly.
# In Vite source maps, each sourcesContent element corresponds 1-to-1 with sources array.
# Let's split blob by `","` or `",null"` or `null,"` or `","../../` etc.

# Let's build a regex that finds the boundaries between sourcesContent elements
# An element boundary is: `"\n",` or `"\r\n",` or `"\n", "` or `",null,` or `", "`
# Let's use Python's regex to find string entries!

out_dir = '/tmp/extracted_src'
os.makedirs(out_dir, exist_ok=True)

# For each target file in src/, let's find its content!
# Let's check which index each src/ file has in sources:
src_map = {}
for i, s in enumerate(sources):
    if 'src/' in s:
        src_map[i] = s.replace('../../', '').replace('../', '')

print(f"Targeting {len(src_map)} src/ files:")
for i, path in src_map.items():
    print(f"Index {i}: {path}")

# Let's parse items from blob sequentially with a custom string parser
pos = 0
items = []
dec = json.JSONDecoder(strict=False)

while pos < len(blob) and len(items) < len(sources):
    while pos < len(blob) and blob[pos] in ' \t\r\n,':
        pos += 1
    if pos >= len(blob) or blob[pos] == ']':
        break
    
    if blob[pos:pos+4] == 'null':
        items.append(None)
        pos += 4
        continue
    
    if blob[pos] == '"':
        # Find closing quote of string
        # A valid closing quote of sourcesContent string is followed by `,` or `]`
        # AND it is NOT escaped (odd number of backslashes before it)
        # AND next token is either `null` or `"`
        cur = pos + 1
        found_end = -1
        while cur < len(blob):
            if blob[cur] == '"':
                # check backslashes
                b = cur - 1
                b_count = 0
                while b >= pos and blob[b] == '\\':
                    b_count += 1
                    b -= 1
                if b_count % 2 == 0:
                    # unescaped quote! Check what comes after
                    rest = blob[cur+1:cur+30].lstrip()
                    if rest.startswith(',') or rest.startswith(']'):
                        # Check if next token after comma is valid (starts with " or null or ])
                        next_token = rest[1:].lstrip()
                        if rest.startswith(']') or next_token.startswith('"') or next_token.startswith('null') or next_token.startswith(']'):
                            found_end = cur
                            break
            cur += 1
        
        if found_end != -1:
            raw_val = blob[pos:found_end+1]
            try:
                val = json.loads(raw_val, strict=False)
            except Exception:
                val = raw_val[1:-1].replace('\\\\', '\\').replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
            items.append(val)
            pos = found_end + 1
        else:
            print(f"Failed to find end of string for item {len(items)} at pos {pos}")
            break
    else:
        pos += 1

print(f"Successfully decoded {len(items)} items from sourcesContent!")

extracted_count = 0
for idx, path in src_map.items():
    if idx < len(items) and items[idx]:
        out_file = os.path.join(out_dir, path)
        os.makedirs(os.path.dirname(out_file), exist_ok=True)
        with open(out_file, 'w', encoding='utf-8') as out:
            out.write(items[idx])
        extracted_count += 1
        print(f"EXTRACTED [{idx}] {path} ({len(items[idx])} chars)")

print(f"Total extracted files: {extracted_count}/{len(src_map)}")
