import fs from 'fs';

function findActualDuplicates(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const keys = new Map<string, number[]>();

  lines.forEach((line, index) => {
    const match = line.match(/^\s+([a-zA-Z0-9_]+):/);
    if (match) {
      const key = match[1];
      if (keys.has(key)) {
        keys.get(key)!.push(index + 1);
      } else {
        keys.set(key, [index + 1]);
      }
    }
  });

  let found = false;
  keys.forEach((lines, key) => {
    if (lines.length > 1) {
      console.log(`Actual duplicate key in ${filePath}: "${key}" found on lines: ${lines.join(', ')}`);
      found = true;
    }
  });
  return found;
}

function findRedundantKeys(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const valueToKeys = new Map<string, string[]>();

  lines.forEach((line, index) => {
    const match = line.match(/^\s+([a-zA-Z0-9_]+):\s*"(.+)",?$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      if (valueToKeys.has(value)) {
        valueToKeys.get(value)!.push(key);
      } else {
        valueToKeys.set(value, [key]);
      }
    }
  });

  console.log(`\nRedundant keys (same value in ${filePath}):`);
  valueToKeys.forEach((keys, value) => {
    if (keys.length > 1) {
      console.log(`Value: "${value}" is used by keys: ${keys.join(', ')}`);
    }
  });
}

console.log('Checking for actual duplicate keys...');
findActualDuplicates('src/locales/en.ts');
findActualDuplicates('src/locales/fr.ts');

console.log('\nChecking for redundant keys...');
findRedundantKeys('src/locales/en.ts');
findRedundantKeys('src/locales/fr.ts');
