# Addon-Compiler from BlockState.Team (Made by Blues)

This simple compiler requires both [NodeJS](https://nodejs.org/en) and [Chrome](https://www.google.com/chrome/) to work properly!
[CLICK ME FOR DOWNLOAD](https://www.blockstate.team/BlockState-Add-On-Compiler.vbs)


For dev, download this repo, and run "npm i" then "node app" to launch the compiler UI

If you want to add your own UI (through CSS), go to "C:\Addon-Compiler-main\public", create a "user.css", the program should now be able to use it as an UI

# Changelog
### v1.0.0
- Add compiling feature using CLI

### v1.1.0
- Add an UI for the program
- Auto-scan and seperate projects into RP, BP and Add-On
- Add auto-update system to handle update from Github
- Add an UI switcher system
- Add "Let me decide" option as an export location when compiling Add-On
- Fix several bugs related to the UI
- Fix a bug that could happen when user cancel the Directory Promt when they're exporting Add-On
- Fix several bugs related to how NodeJS BE handle file scanning
- Add a new user.css for further customization
- Revamp UI for more animations
- Fix an important bugs that cause the program to crash if the user changes the UI rapidly
- Add "Setting" with Help section (Discord) and an Uninstall feature
- Add a new system to let user select their own Directory as a default path
- Add an Alert system and manual update mode

### v1.1.1
- Fix bugs that cause the program to freeze when rapid compiling requests are made
- The alert system is now triggered for more events (add/remove directory, compiling request, uninstall alert, etc)
- Fix a bug that prevent user from removing custom directory
- Revamp the compiling process! Now it should run faster
- New DEV-mode for contributor! Prevent updates, manual-update, uninstall from happening / Prevent queue system to take effect (for rapid request testing) / Enable logs system (Backend logs ONLY) if DEV-mode is activated

### v1.2.0 [CURRENT]
- The jump up Update!
- Now Add-On compiler will check for the latest ScriptAPI dependency (minecraft-server only) and promt you to update it. This system isn't perfect, please be careful when you're using it
- Fix a bug that cause the "Compile" button to have inconsistency padding/width when re-sizing the windows
- Fix a bug that cause the "Remove custom directory" to not reset back to the previous state
- Fix bugs related to how Add-On was indexed and seperated (Minor speed increase is expected)
