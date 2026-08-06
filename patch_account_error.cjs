const fs = require('fs');
let content = fs.readFileSync('src/components/Account.tsx', 'utf8');

// replace {error.includes('registered') && (
content = content.replace(/{error\.includes\('registered'\) && \(/g, "{(typeof error === 'string' && error.includes('registered')) && (");

// ensure the error message is a string for rendering
content = content.replace(/<p>\{error\}<\/p>/g, "<p>{typeof error === 'string' ? error : (error as any)?.message || 'An error occurred'}</p>");

fs.writeFileSync('src/components/Account.tsx', content);
