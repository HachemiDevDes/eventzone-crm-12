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
  
  // standard regex replaces
  newContent = newContent.replace(/text-blue-[567]00/g, 'text-primary');
  newContent = newContent.replace(/bg-blue-[567]00/g, 'bg-primary');
  newContent = newContent.replace(/bg-blue-(50|100)/g, 'bg-primary/10');
  newContent = newContent.replace(/text-blue-(800|900)/g, 'text-primary-dark');
  newContent = newContent.replace(/border-blue-(100|200|300|400)/g, 'border-primary/20');
  newContent = newContent.replace(/border-blue-[56]00/g, 'border-primary');
  newContent = newContent.replace(/shadow-blue-(100|200)/g, 'shadow-primary/20');
  newContent = newContent.replace(/hover:bg-blue-(50|100)/g, 'hover:bg-primary/10');
  newContent = newContent.replace(/hover:text-blue-[567]00/g, 'hover:text-primary');
  newContent = newContent.replace(/hover:bg-blue-[567]00/g, 'hover:bg-primary-dark');
  newContent = newContent.replace(/bg-\[#2B7FFF\]/g, 'bg-primary');
  newContent = newContent.replace(/text-\[#2B7FFF\]/g, 'text-primary');
  newContent = newContent.replace(/shadow-\[#2B7FFF\]\/20/g, 'shadow-primary/20');
  newContent = newContent.replace(/from-\[#1B4F8A\] to-\[#2563EB\]/g, 'from-primary-dark to-primary');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedCount++;
  }
});
console.log('Modified files:', changedCount);
