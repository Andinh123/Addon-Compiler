Dim objShell
Set objShell = WScript.CreateObject("WScript.Shell")

' Define the Node.js script file path
Dim scriptPath
scriptPath = """C:\Program Files\Addon Compiler\app.js"""

' Build the command to run Node.js
Dim command
command = "node " & scriptPath

' Execute the Node.js script
objShell.Run command, 0, True

' Clean up
Set objShell = Nothing