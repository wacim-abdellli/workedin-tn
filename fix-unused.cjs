const fs = require('fs');

function replaceInFile(file, oldStr, newStr) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(file, content);
}

replaceInFile('src/pages/ClientOnboarding.tsx', 'catch (e) {', 'catch {');
replaceInFile('src/pages/FreelancerOnboarding.tsx', 'catch (e) {', 'catch {');
replaceInFile('src/pages/Messages.tsx', 'catch (e: any) {', 'catch {');
replaceInFile('src/pages/FreelancerDashboard.tsx', 'Object.entries(progressStatus).map(([key, isComplete]) => (', 'Object.entries(progressStatus).map(([, isComplete]) => (');
replaceInFile('src/services/messages.ts', 'const { error } = await supabase', 'const { error: _error } = await supabase');

console.log('Fixed unused variables');
