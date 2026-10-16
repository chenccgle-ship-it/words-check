param([Parameter(Mandatory=$true)][string]$PackageRoot,[Parameter(Mandatory=$true)][string]$ArchivePath)
$ErrorActionPreference = 'Stop'
$wordsShell = New-Object -ComObject WScript.Shell
$wordsLink = $wordsShell.CreateShortcut((Join-Path $PackageRoot '启动 words check.lnk'))
$wordsLink.TargetPath = Join-Path $PackageRoot '启动 words check.vbs'
$wordsLink.RelativePath = '.\启动 words check.vbs'
$wordsLink.Description = '双击启动 words check 并打开浏览器'
$wordsLink.WindowStyle = 7
$wordsLink.IconLocation = "$env:WINDIR\System32\shell32.dll,13"
$wordsLink.Save()
Compress-Archive -LiteralPath $PackageRoot -DestinationPath $ArchivePath -CompressionLevel Optimal -Force
