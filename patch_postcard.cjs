const fs = require('fs');
let code = fs.readFileSync('src/components/PostCard.tsx', 'utf8');

const oldDelete = `      if (res.ok) {
        setIsDeleted(true);
        setShowDeleteModal(false);
        showToast(t('common.post.deleteSuccess') || 'Postingan berhasil dihapus');
        onPostUpdated();
      }`;

const newDelete = `      if (res.ok) {
        setIsDeleted(true);
        setShowDeleteModal(false);
        showToast(t('common.post.deleteSuccess') || 'Postingan berhasil dihapus');
        setPosts(prev => prev.filter(p => p.id !== post.id));
        onPostUpdated();
      }`;

code = code.replace(oldDelete, newDelete);
fs.writeFileSync('src/components/PostCard.tsx', code);
console.log("Patched PostCard.tsx delete logic");
