const fs = require('fs');
const path = require('path');

const filesDir = path.join(__dirname, 'flie');

const files = fs.readdirSync(filesDir)
  .filter(name => fs.statSync(path.join(filesDir, name)).isFile())
  .map(name => {
    const stat = fs.statSync(path.join(filesDir, name));
    return { name, size: stat.size, modified: stat.mtime };
  });

fs.writeFileSync('files.json', JSON.stringify(files, null, 2));
console.log(`files.json: ${files.length} files`);
