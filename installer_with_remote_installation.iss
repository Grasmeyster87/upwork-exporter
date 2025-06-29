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
function IsNodeInstalled(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := Exec('cmd.exe', '/c node -v', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
end;

function DownloadNodeInstaller(const URL, DestFile: string): Boolean;
var
  WinHttp: Variant;
  Stream: Variant;
begin
  try
    WinHttp := CreateOleObject('WinHttp.WinHttpRequest.5.1');
    WinHttp.Open('GET', URL, False);
    WinHttp.Send();

    if WinHttp.Status = 200 then
    begin
      Stream := CreateOleObject('ADODB.Stream');
      Stream.Type := 1; // Binary
      Stream.Open();
      Stream.Write(WinHttp.ResponseBody);
      Stream.SaveToFile(DestFile, 2); // Overwrite
      Stream.Close();
      Result := True;
    end
    else
    begin
      MsgBox('Помилка завантаження Node.js: HTTP ' + IntToStr(WinHttp.Status), mbError, MB_OK);
      Result := False;
    end;
  except
    MsgBox('Не вдалося завантажити Node.js. Перевірте з’єднання з Інтернетом.', mbError, MB_OK);
    Result := False;
  end;
end;

function InitializeSetup(): Boolean;
var
  TempPath: string;
  InstallerPath: string;
  ResultCode: Integer;
  NodeURL: string;
begin
  Result := True;

  if not IsNodeInstalled() then
  begin
    if MsgBox('Node.js не знайдено. Бажаєте завантажити та встановити його?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      TempPath := ExpandConstant('{tmp}');
      NodeURL := 'https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi';
      InstallerPath := TempPath + '\node-installer.msi';

      if DownloadNodeInstaller(NodeURL, InstallerPath) then
      begin
        if not ShellExec('', InstallerPath, '', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
        begin
          MsgBox('Не вдалося запустити інсталятор Node.js.', mbError, MB_OK);
          Result := False;
        end;
      end
      else
      begin
        Result := False;
      end;
    end
    else
    begin
      MsgBox('Установка перервана. Node.js є обов’язковим.', mbCriticalError, MB_OK);
      Result := False;
    end;
  end;
end;
