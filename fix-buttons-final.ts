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
  let content = fs.readFileSync(file, 'utf8');
  let newContent = '';

  let i = 0;
  while (i < content.length) {
    let match = false;
    let tagName = '';
    if (content.startsWith('<button', i)) { match = true; tagName = '<button'; }
    else if (content.startsWith('<Button', i)) { match = true; tagName = '<Button'; }

    if (match) {
      newContent += tagName;
      i += tagName.length;
      
      let braceDepth = 0;
      let inQuotes = false;
      let quoteChar = '';
      let tagContent = '';

      while (i < content.length) {
        let char = content[i];
        tagContent += char;
        
        if (inQuotes) {
          if (char === quoteChar) inQuotes = false;
        } else {
          if (char === '"' || char === "'" || char === '`') {
            inQuotes = true;
            quoteChar = char;
          } else if (char === '{') {
            braceDepth++;
          } else if (char === '}') {
            braceDepth--;
          } else if (char === '>' && braceDepth === 0) {
            // End of tag
            break;
          }
        }
        i++;
      }
      
      // We have the full tag content. Let's do a global replace for rounded classes.
      // But only replace if it looks like a class name (contains rounded-sm, etc)
      // Actually, we can just replace \brounded(-[a-z0-9]+)?\b(?!-full) with rounded-full
      let modifiedTagContent = tagContent.replace(/\brounded(-(?:sm|md|lg|xl|2xl|3xl))?\b(?!-full)/g, 'rounded-full');
      // Replace just "rounded" standalone
      modifiedTagContent = modifiedTagContent.replace(/\brounded\b(?!-)/g, 'rounded-full');

      newContent += modifiedTagContent;
      i++; // advance past '>'
    } else {
      newContent += content[i];
      i++;
    }
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log('Modified files:', changedCount);
