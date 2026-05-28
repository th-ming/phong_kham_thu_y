Set shell = CreateObject("Shell.Application")
Set fso = CreateObject("Scripting.FileSystemObject")
repo = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
bat = repo & "\fix-pagefile-safe-c.bat"
shell.ShellExecute bat, "", repo, "runas", 1
