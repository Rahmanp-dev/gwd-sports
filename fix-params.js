const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) results = results.concat(walkDir(filePath));
    else if (file === 'route.ts') results.push(filePath);
  });
  return results;
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const files = walkDir(apiDir);
let fixCount = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('params: Promise')) return;
  
  // Split content into export async function blocks
  const funcRegex = /export async function (\w+)\(([^)]*)\)\s*\{/g;
  let match;
  const insertions = [];
  
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    const funcStart = match.index + match[0].length;
    
    // Find the params type from the signature
    const sig = match[2];
    const paramTypeMatch = sig.match(/params: Promise<\{\s*([^}]+)\s*\}>/);
    if (!paramTypeMatch) continue;
    
    // Parse param names: "id: string" or "studentId: string; kitId: string"
    const paramDefs = paramTypeMatch[1].split(/[;,]/).map(p => p.trim().split(':')[0].trim()).filter(Boolean);
    
    // Find the end of this function (matching braces)
    let braceCount = 1;
    let pos = funcStart;
    while (pos < content.length && braceCount > 0) {
      if (content[pos] === '{') braceCount++;
      if (content[pos] === '}') braceCount--;
      pos++;
    }
    const funcBody = content.substring(funcStart, pos - 1);
    
    // Check if any param name is used in the body without being destructured
    const hasAwaitParams = funcBody.includes('await params');
    
    // Check if any param var is used in body
    const usesParamVars = paramDefs.some(p => {
      const regex = new RegExp('\\b' + p + '\\b');
      return regex.test(funcBody);
    });
    
    if (usesParamVars && !hasAwaitParams) {
      // Need to add destructuring. Find the position after "try {"
      const tryMatch = funcBody.match(/try\s*\{/);
      if (tryMatch) {
        const insertPos = funcStart + tryMatch.index + tryMatch[0].length;
        const destructure = `\n    const { ${paramDefs.join(', ')} } = await params;`;
        insertions.push({ pos: insertPos, text: destructure });
      }
    }
  }
  
  // Apply insertions in reverse order
  if (insertions.length > 0) {
    insertions.sort((a, b) => b.pos - a.pos);
    insertions.forEach(ins => {
      content = content.substring(0, ins.pos) + ins.text + content.substring(ins.pos);
    });
    fs.writeFileSync(filePath, content, 'utf8');
    fixCount += insertions.length;
    console.log(`Fixed ${insertions.length} function(s) in: ${path.relative(__dirname, filePath)}`);
  }
});

console.log(`\nTotal fixes: ${fixCount}`);
