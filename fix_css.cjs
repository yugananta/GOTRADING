const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf-8');

code = code.replace('@import "tailwindcss";', '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));');

// Update body css
code = code.replace('background-color: #0B0E14;\n  color: #F3F4F6;', 
  'background-color: #F9FAFB;\n  color: #111827;\n}\n\n:is(.dark) body {\n  background-color: #0B0E14;\n  color: #F3F4F6;');

fs.writeFileSync('src/index.css', code);
console.log('Fixed index.css');
