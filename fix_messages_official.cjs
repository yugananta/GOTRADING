const fs = require('fs');
let content = fs.readFileSync('src/components/Messages.tsx', 'utf-8');
content = content.replace(
  "avatar: 'TO',",
  "avatar: '/company_logo.png',"
);
fs.writeFileSync('src/components/Messages.tsx', content, 'utf-8');
console.log('Fixed Messages.tsx TO logo');
