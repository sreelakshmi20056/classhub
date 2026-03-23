const fs = require('fs');
const s = fs.readFileSync('src/pages/StudentClassPage.js', 'utf8');
const bt = (s.match(/`/g) || []).length;
const lt = (s.match(/</g) || []).length;
const gt = (s.match(/>/g) || []).length;
console.log('backticks', bt, 'lt', lt, 'gt', gt);
