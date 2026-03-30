const fs = require("fs");
const missingStrData = fs.readFileSync("MISSING_TRANSLATIONS.json", "utf8");
const missingObj = JSON.parse(missingStrData);
const arToPath = {};
Object.entries(missingObj).forEach(([cat, keys]) => {
  Object.entries(keys).forEach(([key, langs]) => {
    arToPath[langs.ar] = `t.${cat}?.${key}`;
  });
});
function findAllFiles(dir, files = []) {
  if (dir.includes("node_modules") || dir.includes("dist") || dir.includes("i18n")) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = dir + "/" + item;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findAllFiles(fullPath, files);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}
const allFiles = findAllFiles("src");
let changedFiles = 0;
allFiles.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let original = content;
  Object.entries(arToPath).forEach(([ar, path]) => {
    if (content.includes(ar)) {
      // 1. Single quotes
      content = content.split(`'${ar}'`).join(`${path} || '${ar}'`);
      // 2. Double quotes
      content = content.split(`"${ar}"`).join(`${path} || "${ar}"`);
      // 3. JSX Text
      // This is trickier because we might have whitespaces.
      // But we can just use string replace.
      content = content.split(`>${ar}<`).join(`>{${path} || '${ar}'}<`);
    }
  });
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log("Updated", file);
  }
});
console.log("Done, modified", changedFiles, "files");