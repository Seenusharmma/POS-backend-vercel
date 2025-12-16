const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../../../frontend/src');

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
    // ignore
  }
  return results;
}

const allJsxFiles = getAllFiles(srcDir, ['.jsx', '.js']);
const allFilesContent = allJsxFiles.map(f => ({
  path: f,
  content: fs.readFileSync(f, 'utf8')
}));

const componentFiles = allJsxFiles.filter(f => f.endsWith('.jsx'));
const unused = [];

componentFiles.forEach(compFile => {
  const compName = path.basename(compFile, '.jsx');
  if (compName === 'App' || compName === 'main' || compName === 'index') return;

  const isUsed = allFilesContent.some(file => {
    if (file.path === compFile) return false;
    // Simple string match
    return file.content.includes(compName);
  });

  if (!isUsed) {
    unused.push(path.relative(srcDir, compFile));
  }
});

fs.writeFileSync('unused_report.txt', unused.join('\n'));
console.log('Done');
