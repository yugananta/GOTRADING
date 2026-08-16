import fs from 'fs';

const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

const oldCode = `  app.post('/api/upload-logo', async (req: any, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: 'No image provided' });
      const base64Data = image.replace(/^data:image\\/\\w+;base64,/, "");
      fs.writeFileSync(path.join(process.cwd(), 'public', 'gotrading_logo.png'), base64Data, { encoding: 'base64' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save logo' });
    }
  });`;

const newCode = `  app.post('/api/upload-logo', async (req: any, res) => {
    try {
      const { image, type } = req.body;
      if (!image) return res.status(400).json({ error: 'No image provided' });
      const base64Data = image.replace(/^data:image\\/\\w+;base64,/, "");
      const fileName = type === 'chat' ? 'chat_logo.png' : 'gotrading_logo.png';
      fs.writeFileSync(path.join(process.cwd(), 'public', fileName), base64Data, { encoding: 'base64' });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save logo' });
    }
  });`;

code = code.replace(oldCode, newCode);
fs.writeFileSync(file, code);
