import json
import re
import os

map_path = '/app/applet/android/app/src/main/assets/public/assets/index-DAGJp1WC.js.map'
if not os.path.exists(map_path):
    print("Map not found at", map_path)
    exit(1)

with open(map_path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

with open('/tmp/sources_list.json', 'r', encoding='utf-8') as f:
    sources = json.load(f)

print('Total sources:', len(sources))

os.makedirs('/tmp/extracted_src', exist_ok=True)

sc_key = '"sourcesContent":['
idx = text.find(sc_key)
content_blob = text[idx + len(sc_key):]

decoder = json.JSONDecoder(strict=False)

pos = 0
item_idx = 0
success_count = 0

while pos < len(content_blob) and item_idx < len(sources):
    while pos < len(content_blob) and content_blob[pos] in ' \t\r\n,':
        pos += 1
    if pos >= len(content_blob) or content_blob[pos] == ']':
        break
    
    src_name = sources[item_idx]
    
    if content_blob[pos:pos+4] == 'null':
        pos += 4
        item_idx += 1
        continue
    
    if content_blob[pos] == '"':
        try:
            val, end = decoder.raw_decode(content_blob, pos)
            pos = end
            if 'src/' in src_name and val:
                rel_path = src_name.replace('../../', '').replace('../', '')
                out_file = os.path.join('/tmp/extracted_src', rel_path)
                os.makedirs(os.path.dirname(out_file), exist_ok=True)
                with open(out_file, 'w', encoding='utf-8') as out:
                    out.write(val)
                success_count += 1
                print(f'[{item_idx}] Extracted {rel_path} ({len(val)} chars)')
        except Exception as e:
            next_pos = pos + 1
            while next_pos < len(content_blob):
                if content_blob[next_pos] == '"':
                    sub = content_blob[next_pos+1:next_pos+10].strip()
                    if sub.startswith(',') or sub.startswith(']'):
                        raw_str = content_blob[pos:next_pos+1]
                        try:
                            val = json.loads(raw_str, strict=False)
                        except Exception:
                            val = raw_str[1:-1]
                            val = val.replace('\\\\', '\\').replace('\\"', '"').replace('\\n', '\n').replace('\\t', '\t')
                        if 'src/' in src_name and val:
                            rel_path = src_name.replace('../../', '').replace('../', '')
                            out_file = os.path.join('/tmp/extracted_src', rel_path)
                            os.makedirs(os.path.dirname(out_file), exist_ok=True)
                            with open(out_file, 'w', encoding='utf-8') as out:
                                out.write(val)
                            success_count += 1
                            print(f'[{item_idx}] Recovered {rel_path} ({len(val)} chars)')
                        pos = next_pos + 1
                        break
                next_pos += 1
            if next_pos >= len(content_blob):
                break
    else:
        pos += 1
    item_idx += 1

print(f'Done! Successfully extracted {success_count} src files.')
