// install-service.js
const path = require('path');
const Service = require('node-windows').Service;

const svc = new Service({
    name: 'UpworkBackService',
    description: 'Node.js сервер для експорту вакансій з Upwork',
    script: path.join(__dirname, 'server.js'),
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ]
});

svc.on('install', () => {
    console.log('✅ Службу встановлено');
    svc.start();
});

svc.install();
