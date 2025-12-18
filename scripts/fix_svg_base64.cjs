
const fs = require('fs');
const svgPath = 'src/lib/image-editor/svg/default.svg';
const content = fs.readFileSync(svgPath, 'utf8');
const base64 = Buffer.from(content).toString('base64');
const out = `data:image/svg+xml;base64,${base64}`;
fs.writeFileSync(svgPath, out, 'utf8');
console.log('SVG converted to base64 data URI');
