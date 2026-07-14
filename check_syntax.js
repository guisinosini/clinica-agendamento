const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('src/app/reservar/page.tsx', 'utf-8');

try {
  acorn.Parser.extend(jsx()).parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020,
    locations: true
  });
  console.log("No syntax errors found!");
} catch (e) {
  console.error("Syntax Error at line", e.loc.line, "column", e.loc.column);
  console.error(e.message);
}
