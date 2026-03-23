const fs = require('fs');
const lines = fs.readFileSync('src/pages/StudentClassPage.js', 'utf8').split(/\r?\n/);
const start = 650;
const end = 730;
let count = 0;
for (let i = start; i <= end; i++) {
  const line = lines[i - 1];
  const opens = (line.match(/<div\b/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  count += opens - closes;
  if (count < 0) {
    console.log('negative at', i, line);
  }
  if (opens || closes) {
    console.log(i, 'opens', opens, 'closes', closes, 'count', count, line.trim());
  }
}
console.log('final count:', count);
