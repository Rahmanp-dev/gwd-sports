const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

// Replacements setup
const arr1 = "['beginner', 'intermediate', 'advanced']";
const rep1 = "['beginner', 'intermediate', 'advanced', 'U12', 'U14', 'U16', 'U19', 'U23']";

const arr2 = '["beginner", "intermediate", "advanced"]';
const rep2 = '["beginner", "intermediate", "advanced", "U12", "U14", "U16", "U19", "U23"]';

const type1 = '"beginner" | "intermediate" | "advanced"';
const repType1 = '"beginner" | "intermediate" | "advanced" | "U12" | "U14" | "U16" | "U19" | "U23"';

const msg1 = 'must be beginner, intermediate, or advanced';
const repMsg1 = 'must be beginner, intermediate, advanced, or U12-U23';

const msg2 = 'Must be beginner, intermediate, or advanced';
const repMsg2 = 'Must be beginner, intermediate, advanced, or U12-U23';

const replacements = [
    [arr1, rep1],
    [arr2, rep2],
    [type1, repType1],
    [msg1, repMsg1],
    [msg2, repMsg2]
];

// Target Files Backend
const backendFiles = [
    'backend/src/schemas/studentSchema.ts',
    'backend/src/middleware/validations/trainerValidation.ts',
    'backend/src/middleware/validations/studentvalidation.ts',
    'backend/src/controllers/student/index.ts'
];

// Target Files Frontend
const frontendFiles = [
    'frontend/src/types/index.ts',
    'frontend/src/services/studentService.ts',
    'frontend/src/pages/sections/MGFC/student/StudentCreate.tsx',
    'frontend/src/components/user/student/StudentProfile.tsx',
    'frontend/src/components/admin/students/StudentForm.tsx',
    'frontend/src/components/admin/students/StudentTable.tsx',
    'frontend/src/components/admin/students/StudentDetails.tsx'
];

[...backendFiles, ...frontendFiles].forEach(f => {
    replaceInFile(path.join(__dirname, f), replacements);
});
