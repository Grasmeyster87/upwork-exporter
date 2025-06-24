const fs = require('fs');
const path = require('path');

function printDirectoryStructure(dirPath, indent = '') {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    if (item === 'node_modules') return; // 🛑 Пропустити node_modules

    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}`);
      printDirectoryStructure(fullPath, indent + '  ');
    } else {
      console.log(`${indent}📄 ${item}`);
    }
  });
}

// Виклик
printDirectoryStructure(__dirname); // або вкажи потрібну директорію
