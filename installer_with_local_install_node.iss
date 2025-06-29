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
Source: "backendcopyforinstall\install-service.bat"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "backendcopyforinstall\uninstall-service.bat"; DestDir: "{app}\backend"; Flags: ignoreversion
Source: "node_installer\node-v20.11.1-x64.msi"; DestDir: "{tmp}"; Flags: ignoreversion dontcopy

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

[Code]
// Функція для перевірки чи встановлений Node.js
function IsNodeInstalled(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := Exec('cmd.exe', '/c node -v', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
end;

// Встановлення Node.js якщо не знайдено
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  if not IsNodeInstalled() then
  begin
    if MsgBox('Node.js не знайдено. Бажаєте встановити його зараз?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      // Запускаємо MSI інсталятор Node.js
      if not ShellExec('', ExpandConstant('{tmp}\node_installer\node-v22.16.0-x64.msi'), '', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
      begin
        MsgBox('Помилка встановлення Node.js. Установка перервана.', mbError, MB_OK);
        Result := False;
        exit;
      end;
    end
    else
    begin
      MsgBox('Node.js необхідний для запуску програми. Установка буде завершена.', mbError, MB_OK);
      Result := False;
      exit;
    end;
  end;

  Result := True;
end;
