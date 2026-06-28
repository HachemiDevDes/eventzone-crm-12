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

  // Find all <button ... > or <Button ... > tags
  // We can use a regex with the 'g' flag and replace on the matched tag.
  newContent = newContent.replace(/<(button|Button)([^>]+)>/g, (match, tagName, attrs) => {
    // Inside attrs, find className="..." and replace rounded* within it
    const newAttrs = attrs.replace(/(className\s*=\s*(?:\{cn\()?(?:'|"|`))(.*?)(?:('|"|`)(?:\)\})?)/g, (attrMatch: string, prefix: string, classes: string, suffix: string) => {
      // Replace any \brounded(?:-[a-z0-9]+)?\b with rounded-full
      // but let's be careful not to keep adding -full if it's already rounded-full
      let newClasses = classes.replace(/\brounded(?:-(?:sm|md|lg|xl|2xl|3xl|none))?\b(?!-full)/g, 'rounded-full');
      // If there is just `rounded `, replace that too
      newClasses = newClasses.replace(/\brounded\b(?!-)/g, 'rounded-full');
      return prefix + newClasses + suffix;
    });
    return '<' + tagName + newAttrs + '>';
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});

console.log('Modified files:', changedCount);
