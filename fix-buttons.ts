import fs from 'fs';
import path from 'path';

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  // Replace rounded-lg, rounded-xl, rounded-md with rounded-full inside button tags
  // This is a naive regex but works fairly well for React attributes if we just replace it within the line where `<button` or `<Button` is present
  // A safer way is to match <button [^>]*> and replace inside it
  
  // It's easier just to match buttons and their classes using a string replacer
  newContent = newContent.replace(/(<(?:button|Button)[^>]*className=(?:'|")[^'"]*)rounded-(?:lg|xl|md|sm|2xl)([^'"]*(?:'|"))/gi, '$1rounded-full$2');

  // Multi-line replacement is harder with regex, let's just do a simpler search & replace
  // where the line has both `<button` and `rounded-lg`
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});
console.log('Modified files:', changedCount);
