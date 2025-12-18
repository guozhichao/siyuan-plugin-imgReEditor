
const fs = require('fs');
const path = require('path');

const dir = 'src/lib/image-editor';

function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
        const fullPath = path.join(currentDir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walk(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.styl') || file.endsWith('.d.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // Replace @/ with @editor/
            if (content.includes("'@/")) {
                content = content.replace(/'@\//g, "'@editor/");
                changed = true;
            }
            if (content.includes('"@/')) {
                content = content.replace(/"@\//g, '"@editor/');
                changed = true;
            }

            // Replace @css/ with @editor-css/
            if (content.includes("'@css/")) {
                content = content.replace(/'@css\//g, "'@editor-css/");
                changed = true;
            }
            if (content.includes('"@css/')) {
                content = content.replace(/"@css\//g, '"@editor-css/');
                changed = true;
            }

            // Replace @svg/ with @editor-svg/
            if (content.includes("'@svg/")) {
                content = content.replace(/'@svg\//g, "'@editor-svg/");
                changed = true;
            }
            if (content.includes('"@svg/')) {
                content = content.replace(/"@svg\//g, '"@editor-svg/');
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

walk(dir);
