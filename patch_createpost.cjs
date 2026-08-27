const fs = require('fs');

function patch(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useTranslation')) {
    content = "import { useTranslation } from 'react-i18next';\n" + content;
  }
  content = content.replace(/export const (CreatePost|GroupView)[^=]*=.*\n/, (match) => match + "  const { t } = useTranslation();\n");
  
  if (filePath.includes('CreatePost')) {
    content = content.replace(/> Bullish</g, "> {t('feed.bullish')}<");
    content = content.replace(/> Bearish</g, "> {t('feed.bearish')}<");
    content = content.replace(/<span>Posting<\/span>/g, "<span>{t('feed.postButton')}</span>");
    content = content.replace(/placeholder=\{\`Write a post or share your market analysis with members...\`\}/g, "placeholder={t('feed.postPlaceholder')}");
  } else {
    content = content.replace(/🐂 Bullish</g, "🐂 {t('feed.bullish')}<");
    content = content.replace(/🐻 Bearish</g, "🐻 {t('feed.bearish')}<");
  }
  fs.writeFileSync(filePath, content);
}

patch('src/components/CreatePost.tsx');
patch('src/components/GroupView.tsx');
