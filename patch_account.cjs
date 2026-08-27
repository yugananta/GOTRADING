const fs = require('fs');

const filePath = 'src/components/Account.tsx';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('useTranslation')) {
  content = "import { useTranslation } from 'react-i18next';\n" + content;
  content = content.replace(/export const Account: React.FC[^=]*=.*\n/, (match) => match + "  const { t } = useTranslation();\n");
} else if (!content.match(/const\s+\{\s*t\s*\}\s*=\s*useTranslation/)) {
  content = content.replace(/export const Account: React.FC[^=]*=.*\n/, (match) => match + "  const { t } = useTranslation();\n");
}

content = content.replace(/'Tervalidasi'/g, "t('account.validated')");
content = content.replace(/'Diproses'/g, "t('account.processing')");
content = content.replace(/'Ditolak'/g, "t('account.rejected')");
content = content.replace(/'Belum Validasi'/g, "t('account.notValidated')");
content = content.replace(/>Open Account</g, ">{t('account.openAccount')}<");
content = content.replace(/>Validasi Account</g, ">{t('account.validateAccount')}<");
content = content.replace(/>Connect Account</g, ">{t('account.connectAccount')}<");
content = content.replace(/>← Kembali ke Connect Account</g, ">{t('account.backToConnect')}<");

content = content.replace(/'Akun Anda sudah tervalidasi'/g, "t('account.statusValidated')");
content = content.replace(/'Sedang diverifikasi admin'/g, "t('account.statusProcessing')");
content = content.replace(/'Validasi akun MT5 Anda'/g, "t('account.statusDefault')");

content = content.replace(/>Memeriksa status validasi akun...</g, ">{t('account.checkingStatus')}<");
content = content.replace(/>Validasi Akun Diperlukan</g, ">{t('account.validationRequired')}<");
content = content.replace(/>Akun Anda belum tervalidasi under IB GoTrading. Silakan lengkapi Validasi Akun terlebih dahulu.</g, ">{t('account.validationRequiredDesc')}<");
content = content.replace(/>Lengkapi Validasi Akun</g, ">{t('account.completeValidation')}<");
content = content.replace(/>Validasi Sedang Diproses</g, ">{t('account.validationProcessingTitle')}<");
content = content.replace(/>Validasi sedang diproses, mohon tunggu konfirmasi admin.</g, ">{t('account.validationProcessingDesc')}<");
content = content.replace(/>Cek Status Validasi</g, ">{t('account.checkValidationStatus')}<");
content = content.replace(/>Validasi Ditolak</g, ">{t('account.validationRejectedTitle')}<");
content = content.replace(/>Submit Ulang Validasi</g, ">{t('account.resubmitValidation')}<");
content = content.replace(/>Nomor Akun MT5 \*</g, ">{t('account.mt5Number')}<");
content = content.replace(/>Kirim Validasi</g, ">{t('account.submitValidation')}<");
content = content.replace(/>Validasi Akun</g, ">{t('account.validateAccount')}<");
content = content.replace(/>Validasi Berhasil Dikirim</g, ">{t('account.validationSuccessTitle')}<");
content = content.replace(/>Data validasi akun MT5 Anda telah kami terima dan sedang dalam antrean verifikasi admin.</g, ">{t('account.validationSuccessDesc')}<");
content = content.replace(/'Mohon lengkapi semua data formulir validasi.'/g, "t('account.fillAllFields')");
content = content.replace(/'Validasi akun berhasil dikirim! Menunggu konfirmasi admin.'/g, "t('account.validationSent')");
content = content.replace(/'Gagal mengirim validasi. Silakan coba lagi.'/g, "t('account.validationFailed')");
content = content.replace(/'Terjadi kesalahan jaringan saat mengirim validasi.'/g, "t('account.networkError')");

fs.writeFileSync(filePath, content);
