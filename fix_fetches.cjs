const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/App.tsx',
  'src/components/AdminLogin.tsx',
  'src/components/AdminPortal.tsx',
  'src/components/AppContext.tsx',
  'src/components/CreatePost.tsx',
  'src/components/Explore.tsx',
  'src/components/GroupView.tsx',
  'src/components/Journal.tsx',
  'src/components/Leaderboard.tsx',
  'src/components/MarketPulseModal.tsx',
  'src/components/Messages.tsx',
  'src/components/Network.tsx',
  'src/components/PostCard.tsx',
  'src/components/Profile.tsx',
  'src/components/UserProfile.tsx',
  'src/utils/offlineSync.ts',
  'src/components/Auth.tsx',
  'src/components/Outlook.tsx',
  'src/hooks/useLocationCascade.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file has any fetch('/api/...') or fetch(`/api/...`)
    if (content.match(/fetch\s*\(\s*['"`]\/api\//)) {
      // Calculate relative path to apiFetch
      const isRoot = !file.includes('/');
      const isUtils = file.startsWith('src/utils/');
      const isComponents = file.startsWith('src/components/');
      const isHooks = file.startsWith('src/hooks/');
      
      let importPath = '../utils/apiFetch';
      if (file === 'src/App.tsx') importPath = './utils/apiFetch';
      else if (isUtils) importPath = './apiFetch';
      
      const importStatement = `import { apiFetch } from '${importPath}';\n`;
      
      if (!content.includes('apiFetch')) {
        // Add import after the last import statement
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
        } else {
          content = importStatement + content;
        }
      }
      
      // Replace fetch('/api/...') with apiFetch('/api/...')
      content = content.replace(/fetch\s*\(\s*(['"`]\/api\/[^'"`]+['"`])/g, 'apiFetch($1');
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    }
  }
});
