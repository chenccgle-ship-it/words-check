Option Explicit
Dim fso, shell, folder, command
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = folder
command = Chr(34) & folder & "\runtime\node.exe" & Chr(34) & " " & Chr(34) & folder & "\runtime\server.cjs" & Chr(34)
shell.Run command, 0, False
