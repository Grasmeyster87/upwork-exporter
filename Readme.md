#upwork-exporter

- firebaseKey.json - ключи гугл сервера
- installer.iss - файл программы Inno Setup Compiler для создания инсталяторов
- backendcopyforinstall - папка для копирования из папки backend из которой не должны копироватся файл с ключами .env и папка с файлами node_modules

- **.env файл с ключами который должен копироватся вручную**
- copyforinstall.ps1 - powershell файл для копирования нужных файлов в backendcopyforinstall и последующего создания инсталятора
- installer_without_node_check.iss - установщик без проверки установлена ли Node.js
- installer_with_remote_installation.iss - установщик с проверкой и удаленной установкой Node.js
- installer_with_local_install_node.iss - установщик с проверкой установленной Node.js в случае отсутствия локальной установкой из файла

- ** installer_with_local_install_node.iss Файл установщик должен копироватся с папкой  node_installer**