const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all JSX files in frontend/src
const files = glob.sync('frontend/src/**/*.{js,jsx}', { cwd: process.cwd() });

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Remove unused lucide-react imports
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip unused import lines for lucide-react
    if (line.includes('import {') && line.includes("} from 'lucide-react'")) {
      const importMatch = line.match(/import \{ ([^}]+) \} from/);
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim());
        const usedImports = imports.filter(imp => {
          const regex = new RegExp(`\\b${imp}\\b`, 'g');
          const matches = content.match(regex);
          return matches && matches.length > 1; // More than just the import
        });

        if (usedImports.length === 0) {
          console.log(`Removing unused import line in ${filePath}: ${line.trim()}`);
          modified = true;
          continue; // Skip this line
        } else if (usedImports.length !== imports.length) {
          const newLine = `import { ${usedImports.join(', ')} } from 'lucide-react';`;
          console.log(`Updating import line in ${filePath}: ${newLine}`);
          newLines.push(newLine);
          modified = true;
          continue;
        }
      }
    }

    newLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(fullPath, newLines.join('\n'));
    console.log(`Updated: ${filePath}`);
  }
});

console.log('Unused imports cleanup complete!');
