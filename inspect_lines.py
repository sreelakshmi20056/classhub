path = r'c:\Users\Sreelakhmi\Desktop\classhub\frontend\src\pages\TeacherClassPage.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()
for idx in range(258, 270):
    print(idx+1, repr(lines[idx]))
