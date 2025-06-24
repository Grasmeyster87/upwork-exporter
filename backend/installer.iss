[Setup]
AppName=Upwork Back Service
AppVersion=1.0
DefaultDirName={pf}\UpworkBackService
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=upwork-installer
Compression=lzma
SolidCompression=yes

[Files]
Source: "*"; DestDir: "{app}\backend"; Excludes: "node_modules .env firebaseKey*.json"; Flags: recursesubdirs
Source: "install-service.bat"; DestDir: "{app}\backend"
Source: "uninstall-service.bat"; DestDir: "{app}\backend"


[Run]
; 1. Перевірка/очищення кешу
Filename: "{cmd}"; Parameters: "/c npm cache verify"; WorkingDir: "{app}\backend"; Flags: runhidden waituntilterminated

; 2. Встановлення залежностей
Filename: "{cmd}"; Parameters: "/c npm install"; WorkingDir: "{app}\backend"; Flags: runhidden waituntilterminated

; 3. Реєстрація сервісу (наприклад, через node-windows або NSSM)
Filename: "{app}\backend\install-service.bat"; Flags: runhidden


[Icons]
Name: "{group}\Uninstall"; Filename: "{uninstallexe}"


[UninstallRun]
Filename: "{app}\backend\uninstall-service.bat"; Flags: runhidden waituntilterminated
