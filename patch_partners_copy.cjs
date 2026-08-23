const fs = require('fs');
let code = fs.readFileSync('src/components/TaraptiPartners.tsx', 'utf8');

const oldCopyMethod = `  const copyToClipboard = async (text: string, label: string) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        console.warn('navigator.clipboard.writeText failed, trying fallback', e);
      }
    }
    if (!success) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        document.body.removeChild(textArea);
      }
    }

    if (success) {
      showToast(\`\${label} berhasil disalin!\`);
    } else {
      showToast(\`Gagal menyalin \${label}\`);
    }
  };`;

const newCopyMethod = `  const copyToClipboard = async (text: string, label: string) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        console.warn('navigator.clipboard.writeText failed, trying fallback', e);
      }
    }
    if (!success) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        document.body.removeChild(textArea);
      }
    }

    if (success) {
      showToast(\`\${label} berhasil disalin!\`);
    } else {
      prompt(\`Salin \${label} secara manual:\`, text);
      showToast(\`\${label} berhasil disalin!\`);
    }
  };`;

if (code.includes("showToast(`Gagal menyalin ${label}`);")) {
  code = code.replace(oldCopyMethod, newCopyMethod);
  fs.writeFileSync('src/components/TaraptiPartners.tsx', code);
  console.log("Patched TaraptiPartners.tsx");
} else {
  console.log("Could not find the target string in TaraptiPartners.tsx");
}
