const fs = require('fs');

function patch(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useTranslation')) {
    content = "import { useTranslation } from 'react-i18next';\n" + content;
  }
  content = content.replace(/export const (StoriesList|StoryCreation)[^=]*=.*\n/, (match) => match + "  const { t } = useTranslation();\n");
  content = content.replace(/>Cerita Anda</g, ">{t('feed.yourStory')}<");
  fs.writeFileSync(filePath, content);
}

patch('src/components/StoriesList.tsx');
patch('src/components/StoryCreation.tsx');
