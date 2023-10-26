Option Explicit

Dim objShell, objFSO, objHTTP, objZip, objStream
Dim strURL, strZipFile, strExtractTo, strShortcutPath, strInstallBatPath

' URL of the zip file
strURL = "https://github.com/Andinh123/Addon-Compiler/archive/refs/heads/main.zip"

' Location to save the downloaded zip file
strZipFile = "C:\Temp\main.zip"

' Location to extract the contents
strExtractTo = "C:\"

' Path to the "install.bat" file
strInstallBatPath = strExtractTo & "Addon-Compiler-main\install.bat"

' Create objects
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objHTTP = CreateObject("MSXML2.ServerXMLHTTP.6.0")
Set objZip = CreateObject("Shell.Application")

' Display a message when the script starts
MsgBox "Addon Compiler Installation Script is starting.", vbInformation, "Script Progress"

' Check if the zip file already exists in the temporary folder and delete it if it does
If objFSO.FileExists(strZipFile) Then
    objFSO.DeleteFile strZipFile
End If

' Download the zip file
objHTTP.open "GET", strURL, False
objHTTP.send

If objHTTP.Status = 200 Then
    ' Display a message when the zip file is being downloaded
    MsgBox "Downloading the Addon Compiler zip file...", vbInformation, "Script Progress"

    Set objStream = CreateObject("ADODB.Stream")
    objStream.Open
    objStream.Type = 1 ' Binary
    objStream.Write objHTTP.responseBody
    objStream.Position = 0

    ' Create the directory if it doesn't exist
    If Not objFSO.FolderExists(objFSO.GetParentFolderName(strZipFile)) Then
        objFSO.CreateFolder(objFSO.GetParentFolderName(strZipFile))
    End If

    ' Save the zip file
    objStream.SaveToFile strZipFile
    objStream.Close

    ' Display a message when the zip file is downloaded and being extracted
    MsgBox "Downloaded the zip file. Extracting...", vbInformation, "Script Progress"

    ' Extract the zip file
    objZip.NameSpace(strExtractTo).CopyHere objZip.NameSpace(strZipFile).Items
    WScript.Sleep 5000 ' Wait for extraction to finish (adjust this value as needed)

    ' Run the "install.bat" file
    If objFSO.FileExists(strInstallBatPath) Then
        objShell.Run Chr(34) & strInstallBatPath & Chr(34), 0, True
        MsgBox "Installation complete.", vbInformation, "Script Progress"
    Else
        MsgBox "The install.bat file does not exist in the specified location.", vbExclamation, "Script Progress"
    End If

    ' Create a desktop shortcut
    strShortcutPath = objShell.SpecialFolders("Desktop") & "\Add-On Compiler.lnk"
    CreateShortcut strShortcutPath, strExtractTo & "Addon-Compiler-main\app.vbs", strExtractTo & "Addon-Compiler-main\public\favicon.ico"

    ' Set the "Start in" directory for the shortcut
    SetShortcutStartIn strShortcutPath, strExtractTo & "Addon-Compiler-main\"

    ' Clean up: Delete the downloaded zip file
    objFSO.DeleteFile strZipFile
Else
    MsgBox "Failed to download the zip file.", vbExclamation, "Script Progress"
End If

Set objStream = Nothing
Set objZip = Nothing
Set objHTTP = Nothing
Set objFSO = Nothing
Set objShell = Nothing

Sub CreateShortcut(shortcutPath, targetPath, iconPath)
    ' Create a desktop shortcut
    Dim shortcut
    Set shortcut = objShell.CreateShortcut(shortcutPath)
    shortcut.TargetPath = targetPath
    shortcut.IconLocation = iconPath
    shortcut.Save
End Sub

Sub SetShortcutStartIn(shortcutPath, startInPath)
    ' Set the "Start in" directory for the shortcut
    Dim shortcut
    Set shortcut = objShell.CreateShortcut(shortcutPath)
    shortcut.WorkingDirectory = startInPath
    shortcut.Save
End Sub
