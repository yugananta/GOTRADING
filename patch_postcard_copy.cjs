const fs = require('fs');
let code = fs.readFileSync('src/components/PostCard.tsx', 'utf8');

const oldCopyTry = `      const success = await copyToClipboard(shareUrl);
      if (success) {
        showToast(t('common.post.shareLinkCopied') || 'Link tautan berhasil disalin!');
      } else {
        throw new Error('Fallback copy failed');
      }`;

const newCopyTry = `      const success = await copyToClipboard(shareUrl);
      if (success) {
        showToast(t('common.post.shareLinkCopied') || 'Link tautan berhasil disalin!');
      } else {
        // Fallback to prompt if all clipboard access fails
        prompt(t('common.post.copyLinkFailed') || 'Salin tautan ini secara manual:', shareUrl);
        showToast(t('common.post.shareLinkCopied') || 'Link tautan berhasil disalin!');
      }`;

if (code.includes("throw new Error('Fallback copy failed');")) {
  code = code.replace(oldCopyTry, newCopyTry);
  fs.writeFileSync('src/components/PostCard.tsx', code);
  console.log("Patched PostCard.tsx for fallback copy prompt");
} else {
  console.log("Could not find the target string in PostCard.tsx");
}
