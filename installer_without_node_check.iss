[Setup]
AppName=Upwork Back Service
AppVersion=3.0
DefaultDirName={autopf}\UpworkBackService
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename=upwork-installer
Compression=lzma
SolidCompression=yes

[Files]
Source: "backendcopyforinstall\*"; DestDir: "{app}\backend"; Flags: recursesubdirs createallsubdirs

; Окремо додаємо необхідні файли .bat, якщо вони були пропущені
Source: "backendcopyforinstall\install-service.bat"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "backendcopyforinstall\uninstall-service.bat"; DestDir: "{app}\backend"; Flags: ignoreversion


[Run]
Filename: "{cmd}"; Parameters: "/c npm cache verify"; WorkingDir: "{app}\backend"; Flags: runhidden waituntilterminated
Filename: "{cmd}"; Parameters: "/c npm install"; WorkingDir: "{app}\backend"; Flags: runhidden waituntilterminated
Filename: "{app}\backend\install-service.bat"; Flags: runhidden

[Icons]
Name: "{group}\Uninstall"; Filename: "{uninstallexe}"

[UninstallRun]
Filename: "{app}\backend\uninstall-service.bat"; RunOnceId: "UninstallBackend"; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{app}\backend\database"
Type: filesandordirs; Name: "{app}\backend\daemon"
Type: filesandordirs; Name: "{app}\backend\node_modules"