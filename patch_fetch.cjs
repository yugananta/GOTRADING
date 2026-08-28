const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  { path: 'src/App.tsx', importPath: './utils/apiFetch' },
  { path: 'src/components/Account.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/AdminLogin.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/AdminPortal.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/AppContext.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/CreatePost.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Explore.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/GroupView.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Journal.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Leaderboard.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/MarketPulseModal.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Messages.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Network.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/PostCard.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/Profile.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/components/UserProfile.tsx', importPath: '../utils/apiFetch' },
  { path: 'src/utils/offlineSync.ts', importPath: './apiFetch' }
];

for (const fileObj of filesToUpdate) {
  const filePath = path.join(__dirname, fileObj.path);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${fileObj.path}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace fetch("/api/...") with apiFetch("/api/...")
  // We'll use a regex that looks for fetch( followed by '/api/' or \`/api/
  const fetchRegex = /fetch\(\s*(['"`]\/api\/)/g;
  
  if (fetchRegex.test(content)) {
    content = content.replace(fetchRegex, 'apiFetch($1');
    
    // Add import statement at the top if not already present
    if (!content.includes('import { apiFetch }')) {
      const importStmt = `import { apiFetch } from '${fileObj.importPath}';\n`;
      // Find the last import, or just put it after the first import, or at the top
      content = importStmt + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${fileObj.path}`);
  }
}
