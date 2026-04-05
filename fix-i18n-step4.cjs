const fs = require('fs');
const path = require('path');

const enKeys = \`
        depositAmountError: "Amount must be between {{min}} and {{max}} TND",
        depositNote: "Khedma TN Wallet Deposit",
        noPaymentLink: "Payment link was not generated",
        genericError: "An error occurred. Please try again.",\`;

const arKeys = \`
        depositAmountError: "يجب أن يكون المبلغ بين {{min}} و {{max}} دينار تونسي",
        depositNote: "إيداع في محفظة خدمة",
        noPaymentLink: "لم يتم إنشاء رابط الدفع",
        genericError: "حدث خطأ. يرجى المحاولة مرة أخرى.",\`;

const frKeys = \`
        depositAmountError: "Le montant doit être compris entre {{min}} et {{max}} TND",
        depositNote: "Dépôt sur le portefeuille Khedma",
        noPaymentLink: "Le lien de paiement n'a pas été généré",
        genericError: "Une erreur s'est produite. Veuillez réessayer.",\`;

function addWalletKeys(langPath, keys) {
  let content = fs.readFileSync(langPath, 'utf8');
  const walletRegex = /wallet:\s*\{/;
  if (walletRegex.test(content) && !content.includes('depositAmountError:')) {
    content = content.replace(walletRegex, \`wallet: {
\${keys}\`);
    fs.writeFileSync(langPath, content, 'utf8');
    console.log(\`Added Wallet keys to \${langPath}\`);
  }
}

addWalletKeys(path.join(__dirname, 'src', 'i18n', 'en.ts'), enKeys);
addWalletKeys(path.join(__dirname, 'src', 'i18n', 'ar.ts'), arKeys);
addWalletKeys(path.join(__dirname, 'src', 'i18n', 'fr.ts'), frKeys);
