const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function removeComments(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    if (filePath.endsWith('.html')) {
        // Remove HTML comments
        content = content.replace(/<!--[\s\S]*?-->/g, '');
        // Clean up empty lines created by comment removal
        content = content.replace(/^\s*[\r\n]/gm, '');
    } else if (filePath.endsWith('.ts')) {
        // Remove single line comments (but skip http:// or https://)
        content = content.replace(/(?<!:)\s*\/\/.*$/gm, '');
        // Remove multi-line comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        // Clean up empty lines
        content = content.replace(/(\r?\n){3,}/g, '\n\n');
    } else if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
        // Remove CSS multi-line comments
        content = content.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove CSS single line comments in SCSS
        if (filePath.endsWith('.scss')) {
             content = content.replace(/(?<!:)\s*\/\/.*$/gm, '');
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cleaned:', filePath);
    }
}

const targetDir = path.join(__dirname, 'src');
console.log('Cleaning directory:', targetDir);
walkDir(targetDir, removeComments);
console.log('Done.');
fs.unlinkSync(__filename); // Self-delete
