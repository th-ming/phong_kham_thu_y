Set shell = CreateObject("Shell.Application")
Set fso = CreateObject("Scripting.FileSystemObject")
repo = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
bat = repo & "\fix-pagefile-low-ram.bat"
shell.ShellExecute bat, "", repo, "runas", 1
