Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")
strFolder = "C:\Addon-Compiler-main"
If objFSO.FolderExists(strFolder) Then
    objFSO.DeleteFolder strFolder, True
End If
strDesktop = objShell.SpecialFolders("Desktop")
strShortcut = objFSO.BuildPath(strDesktop, "BlockState Add-On Compiler.lnk")
If objFSO.FileExists(strShortcut) Then
    objFSO.DeleteFile strShortcut
End If
strShortcutOld = objFSO.BuildPath(strDesktop, "Add-On Compiler.lnk")
If objFSO.FileExists(strShortcutOld) Then
    objFSO.DeleteFile strShortcutOld
End If