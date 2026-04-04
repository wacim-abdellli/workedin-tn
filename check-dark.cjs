const fs = require('fs');
const path = require('path');
const targetDirs = ['src/components/jobs', 'src/components/search', 'src/components/job-post', 'src/components/proposals', 'src/components/freelancers'];
const targetFiles = ['src/pages/JobBoard.tsx', 'src/pages/JobDetail.tsx', 'src/pages/JobMatches.tsx', 'src/pages/JobPost.tsx', 'src/pages/JobPostSuccess.tsx', 'src/pages/JobProposals.tsx', 'src/pages/MyProposals.tsx', 'src/pages/SearchResults.tsx', 'src/pages/FindFreelancers.tsx'];

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) arrayOfFiles.push(path.join(dirPath, file));
    }
  });
  return arrayOfFiles;
}

let allFiles = [...targetFiles.filter(f => fs.existsSync(f))];
targetDirs.forEach(dir => { allFiles = getAllFiles(dir, allFiles); });

let count = 0;
allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(/bg-white(?!\s+dark:bg-)/)) {
    console.log('Needs fix: ' + file);
    count++;
  }
});
console.log('Files still needing fix: ' + count);
