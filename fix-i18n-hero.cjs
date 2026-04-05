const fs = require('fs');
const path = require('path');

const enKeys = "        heroDescription: 'Keep account details, security, payouts, and notification behavior in one consistent control surface. Update what matters without losing your place in the product.',";

const frKeys = "        heroDescription: 'Gardez les détails du compte, la sécurité, les paiements et le comportement des notifications sur une surface de contrôle cohérente. Mettez à jour ce qui compte sans perdre votre place dans le produit.',";

function addHeroDescription(langPath, keys) {
  let content = fs.readFileSync(langPath, 'utf8');
  const settingsRegex = /settings:\s*\{/;
  if (settingsRegex.test(content) && !content.includes('heroDescription:')) {
    content = content.replace(settingsRegex, "settings: {\n" + keys);
    fs.writeFileSync(langPath, content, 'utf8');
    console.log("Added heroDescription to " + langPath);
  }
}

addHeroDescription(path.join(__dirname, 'src', 'i18n', 'en.ts'), enKeys);
addHeroDescription(path.join(__dirname, 'src', 'i18n', 'fr.ts'), frKeys);
