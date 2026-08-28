const fs = require('fs');
let content = fs.readFileSync('src/components/Profile.tsx', 'utf-8');

const resizeCode = `
  const resizeImage = (file: File, maxWidth: number, maxHeight: number, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.8));
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 400, 400, (dataUrl) => {
        setAvatarUrl(dataUrl);
      });
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      resizeImage(file, 1200, 1200, (dataUrl) => {
        setCoverPhotoUrl(dataUrl);
      });
    }
  };
`;

const startIndex = content.indexOf('  const handleAvatarChange =');
const endIndex = content.indexOf('  const [firstName,')

content = content.substring(0, startIndex) + resizeCode + '\n' + content.substring(endIndex);

fs.writeFileSync('src/components/Profile.tsx', content, 'utf-8');
console.log('Fixed Profile.tsx');
