import fs from 'fs';
export const writeLogo = (base64Data: string) => {
  const base64Image = base64Data.split(';base64,').pop();
  fs.writeFileSync('public/gotrading_logo.png', base64Image, {encoding: 'base64'});
}
