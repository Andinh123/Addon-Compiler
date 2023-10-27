Set objFSO = CreateObject("Scripting.FileSystemObject")
strFolder = "C:\Addon-Compiler-main"

If objFSO.FolderExists(strFolder) Then
    objFSO.DeleteFolder strFolder, True
    WScript.Echo "Program is removed"
Else
    WScript.Echo "Program source file cannot be found in: " & strFolder
End If