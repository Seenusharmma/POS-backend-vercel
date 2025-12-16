const fs = require('fs');
const path = require('path');

// Go up 3 levels from cmd/find_unused to get to foodfantasy root, then into frontend/src
const srcDir = path.resolve(__dirname, '../../../frontend/src');

console.log('Scanning directory:', srcDir);

function getAllFiles(dir, exts = []) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(filePath, exts));
      } else {
        if (exts.length === 0 || exts.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    });
  } catch (err) {
    console.error('Error reading directory ' + dir + ':', err.message);
  }
  return results;
}

if (!fs.existsSync(srcDir)) {
    console.error("Source directory does not exist:", srcDir);
    process.exit(1);
}

const allJsxFiles = getAllFiles(srcDir, ['.jsx', '.js']);
const allFilesContent = allJsxFiles.map(f => ({
  path: f,
  content: fs.readFileSync(f, 'utf8')
}));

const componentFiles = allJsxFiles.filter(f => f.endsWith('.jsx'));

console.log('Checking ' + componentFiles.length + ' components for usage...');

const unused = [];

componentFiles.forEach(compFile => {
  const compName = path.basename(compFile, '.jsx');
  // Skip some obvious main files
  if (compName === 'App' || compName === 'main' || compName === 'index') return;

  const isUsed = allFilesContent.some(file => {
    if (file.path === compFile) return false; // Don't count self
    // Check for explicit import (more robust) or just string match
    // Simple string match is safer to avoid false positives (saying something is unused when it is used)
    return file.content.includes(compName);
  });

  if (!isUsed) {
    unused.push(path.relative(srcDir, compFile));
  }
});

console.log('\nPotential Unused Components:');
if (unused.length === 0) {
    console.log("None found (or script failed to match)");
} else {
    unused.forEach(u => console.log('- ' + u));
}
