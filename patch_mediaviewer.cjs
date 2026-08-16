const fs = require('fs');
let code = fs.readFileSync('src/components/MediaViewer.tsx', 'utf8');

const oldCopyTry = `    // Fallback clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link tautan berhasil disalin!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Gagal menyalin tautan');
    }`;

const newCopyTry = `    // Fallback clipboard copy
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link tautan berhasil disalin!');
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      prompt('Salin tautan ini secara manual:', shareUrl);
      showToast('Link tautan berhasil disalin!');
    }`;

if (code.includes("await navigator.clipboard.writeText(shareUrl);")) {
  code = code.replace(oldCopyTry, newCopyTry);
  fs.writeFileSync('src/components/MediaViewer.tsx', code);
  console.log("Patched MediaViewer.tsx for fallback copy prompt");
} else {
  console.log("Could not find the target string in MediaViewer.tsx");
}
