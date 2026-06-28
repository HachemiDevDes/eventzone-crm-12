import fs from 'fs';

function fixLocale(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const seenKeys = new Set<string>();
  const newLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        continue;
      }
      seenKeys.add(key);
    }
    newLines.push(line);
  }

  fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

fixLocale('src/locales/en.ts');
fixLocale('src/locales/fr.ts');
