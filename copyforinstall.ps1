# Отримати шлях до поточної папки, де знаходиться скрипт
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "backend"
$target = Join-Path $root "backendcopyforinstall"

# Очистити цільову папку, якщо вона вже існує
if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
}

# Створити цільову папку
New-Item -Path $target -ItemType Directory -Force | Out-Null

# Скопіювати файли з фільтрацією
Get-ChildItem -Path $source -Recurse -Force | Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.Name -notin @('.env', 'firebaseKey.json', 'firebaseKey2.json')
} | ForEach-Object {
    $dest = $_.FullName.Replace($source, $target)
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
    } else {
        Copy-Item -Path $_.FullName -Destination $dest -Force
    }
}

Write-Host "✅ Готово! Папка backendcopyforinstall оновлена."