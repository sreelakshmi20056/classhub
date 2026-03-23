const fs = require('fs');
const path = 'c:/Users/Sreelakhmi/Desktop/classhub/frontend/src/pages/TeacherClassPage.js';
let text = fs.readFileSync(path,'utf8');
const lines = text.split(/\r?\n/);
for(let i=0;i<lines.length;i++){
    if(lines[i].includes('const urlRegex')){
        console.log('old line',i,JSON.stringify(lines[i]));
        lines[i] = '    const urlRegex = /(https?:\\/\\/[^^\\s]+)/g; // match complete URLs';
        console.log('new line',i,lines[i]);
        break;
    }
}
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('updated');
