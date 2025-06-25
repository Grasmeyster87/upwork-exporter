// uninstall-service.js
const path = require('path');
const fs = require('fs');
const Service = require('node-windows').Service;
//------------------------------------------------
// 🧹 Додаткове очищення директорій
const dirsToDelete = [
  path.join(__dirname, 'database'),
  path.join(__dirname, 'daemon'),
  path.join(__dirname, 'node_modules'),
];

dirsToDelete.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🧹 Видалено: ${dir}`);
  }
});
//---------------------------------------------------
// 🧹 Видалення Windows-служби
const svc = new Service({
    name: 'UpworkJobExporter',
    script: path.join(__dirname, 'server.js')
});

svc.on('uninstall', () => {
    console.log('🗑️ Службу видалено');
});

svc.on('alreadyuninstalled', () => {
    console.log('ℹ️ Служба вже не встановлена');
});

svc.uninstall();
