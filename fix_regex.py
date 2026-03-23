path = r'c:\Users\Sreelakhmi\Desktop\classhub\frontend\src\pages\TeacherClassPage.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
# line 264 is index 263
idx = 263
print('old:', lines[idx].rstrip())
lines[idx] = '    const urlRegex = /(https?:\/\/[^^\s]+)/g; // match complete URLs\n'
print('new:', lines[idx].rstrip())
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('done')