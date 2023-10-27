Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")
strFolder = "C:\Addon-Compiler-main"

' Check if the program folder exists and delete it
If objFSO.FolderExists(strFolder) Then
    objFSO.DeleteFolder strFolder, True
    WScript.Echo "Program is removed"
Else
    WScript.Echo "Program source file cannot be found in: " & strFolder
End If

' Get the desktop folder
strDesktop = objShell.SpecialFolders("Desktop")

' Check if the shortcut exists on the desktop and delete it
strShortcut = objFSO.BuildPath(strDesktop, "Add-On Compiler.lnk")

If objFSO.FileExists(strShortcut) Then
    objFSO.DeleteFile strShortcut
    WScript.Echo "Shortcut 'Add-On Compiler' on the desktop is removed"
Else
    WScript.Echo "Shortcut 'Add-On Compiler' not found on the desktop" & strDesktop
End If
