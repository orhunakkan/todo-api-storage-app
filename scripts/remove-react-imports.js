const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all JSX files in frontend/src
const files = glob.sync('frontend/src/**/*.{js,jsx}', { cwd: process.cwd() });

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Remove React import lines
  const newContent = content
    .replace(/^import React from ['"]react['"];\s*\n/gm, '')
    .replace(/^import React, \{ ([^}]+) \} from ['"]react['"];\s*\n/gm, "import { $1 } from 'react';\n")
    .replace(/^import React, \* as React from ['"]react['"];\s*\n/gm, '');

  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent);
    console.log(`Updated: ${filePath}`);
  }
});

console.log('React imports removal complete!');
