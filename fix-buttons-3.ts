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

  // Split by `<button` and `<Button`
  const parts = newContent.split(/(<(?:button|Button)\b)/);
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i += 2) {
      // parts[i] is the tag start
      // parts[i+1] is the rest of the file
      const closingBracketIndex = parts[i+1].indexOf('>');
      if (closingBracketIndex !== -1) {
        let attrs = parts[i+1].substring(0, closingBracketIndex);
        
        // Find every sequence inside attrs that starts with className=
        const classNameRegex = /className=(?:\{cn\()?(['"`])(.*?)\1/gs;
        attrs = attrs.replace(classNameRegex, (match, quote, classes) => {
          let newClasses = classes.replace(/\brounded(-(?:sm|md|lg|xl|2xl|3xl))?\b(?!-full)/g, 'rounded-full');
          if (newClasses !== classes) {
            return match.replace(classes, newClasses);
          }
          return match;
        });

        // What if it is multiple string args inside cn("...", isActive ? "..." : "...")
        // We can just globally replace \brounded(-[a-z0-9]+)?\b(?!-full) within attrs as long as it's not a variable or keyword.
        // Actually, just doing a global replace of 'rounded-lg' etc to 'rounded-full' inside attrs is safest!!
        
        attrs = attrs.replace(/\brounded-lg\b/g, 'rounded-full');
        attrs = attrs.replace(/\brounded-xl\b/g, 'rounded-full');
        attrs = attrs.replace(/\brounded-md\b/g, 'rounded-full');
        attrs = attrs.replace(/\brounded-sm\b/g, 'rounded-full');
        attrs = attrs.replace(/\brounded-2xl\b/g, 'rounded-full');
        attrs = attrs.replace(/\brounded\b(?!-)/g, 'rounded-full');

        parts[i+1] = attrs + parts[i+1].substring(closingBracketIndex);
      }
    }
    
    newContent = parts.join('');
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log('Modified files:', changedCount);
