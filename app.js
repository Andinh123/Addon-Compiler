console.clear();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const express = require('express');
const https = require('https');
const fileDialog = require("popups-file-dialog");
const app = express();
const net = require('net');
const { exec } = require('child_process');
let mainPort;
let latestScriptVersion;
let reOpenAfterUpdate = false;

const getPort = async () => {
    let port;
    do {
        port = Math.floor(Math.random() * (65535 - 49152 + 1) + 49152);
    } while (!(await isPortAvailable(port)));
    return port;
};

const isPortAvailable = async (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log("Port is not available")
                resolve(false);
            } else {
                console.log("Port is not available")
                resolve(true);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, '127.0.0.1');
    }).catch(() => {
        resolve(false);
    });
};
  
(async () => {
    console.log(`STARTING SERVER`);
    mainPort = await getPort();
    console.log(`Port: ${mainPort}`);
    let keepOpenState = true;
    function updateApp() {
        if (process.cwd() === "C:\\Addon-Compiler-main") {
            console.log('Not in DEV mode. Updating.')
            https.get("https://raw.githubusercontent.com/Andinh123/Addon-Compiler/main/instruction.json", (response) => {
                let data = '';
                response.on('data', (chunk) => {
                    data += chunk;
                });
                response.on('end', () => {
                    try {
                        const updateData = JSON.parse(data);
                        console.log(updateData);
                        updateFiles(updateData);
                    } catch (error) {
                        console.error(`Error parsing JSON: ${error.message}`);
                        process.exit();
                    }
                });
            }).on('error', (error) => {
                console.error(`Error fetching data: ${error.message}`);
                process.exit();
            });
        } else {console.log('DEV mode detected. Cancelling update.')};
    };
    function addonProject(array1, array2) {
        const exclusiveTo1 = array1.filter(element => !array2.includes(element)).map(element => element + " RP");
        const commonElements = array1.filter(element => array2.includes(element)).map(element => element + " Addon");
        const exclusiveTo2 = array2.filter(element => !array1.includes(element)).map(element => element + " BP");
        return [exclusiveTo1, commonElements, exclusiveTo2];
    };

    let currentVersion = fs.readFileSync(path.join(__dirname, 'version.txt'), 'utf8');
    console.log(currentVersion);
    https.get("https://raw.githubusercontent.com/Andinh123/Addon-Compiler/main/version.txt", (response) => {
        if (process.cwd() === "C:\\Addon-Compiler-main") {
            console.log('Not in DEV mode. Checking for updates.')
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on('end', () => {
                console.log(data);
                if (data === currentVersion) {
                    console.log("Up to date");
                    keepOpenState = false;
                }
            });
        } else {console.log('No update check in! DEV mode detected.')};
        
    }).on('error', (error) => {
        console.error(`Error fetching data: ${error.message}`);
    });
    const resourcePacksDirectory = path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs');
    const RPprojects = fs.readdirSync(resourcePacksDirectory).filter(rpFolder => {
        return fs.statSync(path.join(resourcePacksDirectory, rpFolder)).isDirectory();
    }).map(rpFolder => rpFolder.replace(/ RP$/, ''));

    console.log(RPprojects);
    const behaviorPacksDirectory = path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs');
    const BPprojects = fs.readdirSync(behaviorPacksDirectory).filter(bpFolder => {
        return fs.statSync(path.join(behaviorPacksDirectory, bpFolder)).isDirectory();
    }).map(bpFolder => bpFolder.replace(/ BP$/, ''));
    function getVersionFromManifest(projects) {
        return projects.map(project => {
            const manifestPath = [
                path.join(behaviorPacksDirectory, project, 'manifest.json'),
                path.join(behaviorPacksDirectory, project + ' BP', 'manifest.json')
            ].find(fs.existsSync);
            try {
                const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                const serverDependency = manifestData.dependencies?.find(dependency => dependency.module_name === '@minecraft/server');
                return [project, serverDependency ? serverDependency.version : "null-script"];
            } catch (error) {
                console.error("code 185");
                return [project, "null-script"];
            }
        });
    };
    app.use(express.json());
    app.use(express.static('public'));
    app.get('/latestScriptVersion', (req, res) => {
        let smallerStrings = [];
        https.get('https://registry.npmjs.org/@minecraft/server', (httpsres) => {
            let data = '';
            httpsres.on('data', (chunk) => {
                data += chunk;
            });
            httpsres.on('end', () => {
                try {
                    const numString = Math.max(
                        ...Object.keys(JSON.parse(data).time).filter(key => /^\d+\.\d+\.\d+/.test(key)).filter(item => item.endsWith("-stable")).map(str => {
                        const match = str.match(/^(\d+\.\d+\.\d+)/);
                        return match
                        ? match[1].split('.').reduce((acc, num, index) => acc + num * Math.pow(100, 2 - index), 0) : null;
                    })
                    ).toString();
                    let i = numString.length;
                    for (; i > 0; i -= 2) {
                        smallerStrings.unshift(numString.slice(Math.max(i - 2, 0), i));
                    };
                    latestScriptVersion = smallerStrings.map(item => Number(item)).join('.')+'-beta';
                    res.set("Content-Type", "text/plain");
                    res.send(latestScriptVersion);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            });
        }).on('error', (error) => {
            console.error('Error code 2');
        });
    });
    app.get('/data', (req, res) => {
        res.send(addonProject(RPprojects, BPprojects));
    });
    app.get('/scriptState', (req, res) => {
        res.send(getVersionFromManifest(BPprojects));
    });
    app.get('/version', (req, res) => {
        res.send(currentVersion);
    });
    app.post('/action/:parameter/:choice', (req, res) => {
        const parameter = req.params.parameter.replace(/ (BP|RP|Addon)$/, '');
        const choice = req.params.choice;
        console.log(`/action/${parameter}/${choice}`);
        if (choice === "choose") { 
            (async () => {
                try {
                    const result = await fileDialog.openDirectory({
                        title: "Select a directory to save the Addon",
                    });
                    console.log(result);
                    res.set("Content-Type", "text/plain");
                    res.status(200).send(`${parameter} is compiled to ${result}`);
                    createAddon(parameter, result);
                } catch (error) {
                    console.log("Directory selection cancelled by the user.");
                }
            })();
        } else if (choice === "desktop") {
            createAddon(parameter, path.join(process.env.USERPROFILE, 'Desktop'));
            res.set("Content-Type", "text/plain");
            res.status(200).send(`${parameter} is compiled to Desktop`);
            console.log(`${parameter} is compiled to Desktop`)
        };
    });
    app.post('/updateScriptVersion/:project', (req, res) => {
        res.set("Content-Type", "text/plain");
        const projectName = req.params.project.replace(/ (BP|RP|Addon)$/, '');
        console.log(projectName)
        const manifestPath = [
            path.join(behaviorPacksDirectory, projectName, 'manifest.json'),
            path.join(behaviorPacksDirectory, projectName + ' BP', 'manifest.json')
        ].find(fs.existsSync);
        console.log(manifestPath);
        try {
            const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const serverDependency = manifestData.dependencies?.find(dependency => dependency.module_name === '@minecraft/server');
            serverDependency.version = latestScriptVersion;
            const updatedManifestData = JSON.stringify(manifestData, null, 2);
            fs.writeFileSync(manifestPath, updatedManifestData, 'utf8');
            res.status(200).send('ok');
        } catch (error) {
            console.log(error);
            res.status(200).send('error');
        };
    });
    app.post('/removePath', (req, res) => {
        const removePath = req.query.path;
        console.log(removePath);
        const filePath = path.join(__dirname, 'public', 'setting.json');
        const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (settings.saveMode === removePath) {
            settings.saveMode = "choose";
        }
        settings.additionPath = settings.additionPath.filter(path => path !== removePath);
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
        res.set("Content-Type", "text/plain");
        res.status(200).send(`${removePath} is removed`);
    });
    app.post('/setting/:name/:value', (req, res) => {
        const name = req.params.name;
        const value = req.params.value;
        console.log(`/setting/${name}/${value}`);
        
        if (value === "addnew") {
            (async () => {
                try {
                    const result = await fileDialog.openDirectory({
                        title: "Select a directory for custom Directory",
                    });
                    console.log(result);
                    const filePath = path.join(__dirname, 'public', 'setting.json');
                    const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    settings[name] = result;
                    settings.additionPath.push(result);
                    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
                    res.set("Content-Type", "text/plain");
                    res.status(200).send(result);
                } catch (error) {
                    res.set("Content-Type", "text/plain");
                    res.status(200).send("cancel");
                    console.log("Directory selection cancelled by the user.");
                }
            })();
        } else {
            res.status(200).json({ message: 'ok' });
            const filePath = path.join(__dirname, 'public', 'setting.json');
            const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            settings[name] = value;
            fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
        }
    });
    app.post('/discord', (req, res) => {
        exec(`start https://discord.blockstate.team`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error code 3`);
            } else {
                console.log('Successfully opened the URL.');
            }
        });
        res.status(200).json({ message: 'ok' });
    });
    app.post('/uninstall', (req, res) => {
        res.set("Content-Type", "text/plain");
        exec(`cscript.exe ${path.join(__dirname, 'uninstall.vbs')}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: 4`);
                res.status(200).send("Something went wrong! Please try again.");
            } else {
                console.log('VBScript execution completed.');
                res.status(200).send("Deleted process completed. Shutting down in 10 seconds.");
                setTimeout(() => {
                    process.exit();
                }, 13000);
            }
        });
    });
    app.listen(mainPort, () => {});
    (async () => {
        const browser = await puppeteer.launch({
            headless: false, 
            defaultViewport: null,
            executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args: [
                '--disable-infobars',
                '--start-maximized',
                `--app=http://localhost:${mainPort}`
                ],
            ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection'],
        });
        app.post('/manualUpdate', (req, res) => {
            console.log('Manual update');
            reOpenAfterUpdate = true;
            browser.close();
        });
        browser.on('disconnected', () => {
            if (keepOpenState === false) {
                process.exit();
            } else {
                updateApp();
            }
        });
    })();
    function createAddon(projectName, outputDir, excludePackage) {
        const basePath = path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang');
        const addonZipPath = path.join(outputDir, `${projectName} Addon.mcaddon`);
        let BPpath, RPpath;
    
        if (fs.existsSync(path.join(basePath, 'development_behavior_packs', projectName + ' BP'))) {
            BPpath = path.join(basePath, 'development_behavior_packs', projectName + ' BP');
        } else {
            BPpath = path.join(basePath, 'development_behavior_packs', projectName);
        }
    
        if (fs.existsSync(path.join(basePath, 'development_resource_packs', projectName + ' RP'))) {
            RPpath = path.join(basePath, 'development_resource_packs', projectName + ' RP');
        } else {
            RPpath = path.join(basePath, 'development_resource_packs', projectName);
        }
    
        const inputFolders = [
            { name: projectName + ' BP', path: BPpath },
            { name: projectName + ' RP', path: RPpath }
        ];
    
        const output = fs.createWriteStream(addonZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
    
        output.on('close', () => {
            console.log(`Successfully created: ${addonZipPath}`);
        });
    
        archive.pipe(output);
    
        function isExcluded(filePath) {
            const excludeList = ['package.json', 'package-lock.json', 'node_modules'];
            return excludePackage && excludeList.includes(path.basename(filePath));
        }
    
        function addDirectoryToArchive(sourcePath, targetPath) {
            const files = fs.readdirSync(sourcePath);
    
            files.forEach(file => {
                const filePath = path.join(sourcePath, file);
                if (!isExcluded(filePath)) {
                    if (fs.statSync(filePath).isDirectory()) {
                        archive.directory(filePath, path.join(targetPath, file));
                    } else {
                        archive.file(filePath, { name: path.join(targetPath, file) });
                    }
                }
            });
        }
    
        inputFolders.forEach(folderInfo => {
            if (folderInfo.path) {
                if (folderInfo.name === projectName + ' BP') {
                    // Handle the "scripts" folder within "BPpath"
                    const scriptsPath = path.join(folderInfo.path, 'scripts');
                    if (fs.existsSync(scriptsPath)) {
                        addDirectoryToArchive(scriptsPath, 'scripts');
                    }
                }
    
                // Archive other directories or files
                addDirectoryToArchive(folderInfo.path, folderInfo.name);
            }
        });
    
        archive.finalize();
    }
    function updateFiles(updateData) {
        const downloadPromises = [];
    
        // Process hard updates first
        const hardUpdateFiles = updateData[0];
        hardUpdateFiles.forEach(([filename, url]) => {
            const promise = new Promise((resolve, reject) => {
                https.get(url, (response) => {
                    if (response.statusCode === 200) {
                        const fileStream = fs.createWriteStream(path.join(__dirname, filename));
                        response.pipe(fileStream);
    
                        fileStream.on('finish', () => {
                            fileStream.close();
                            console.log(`Updated (hard): ${filename}`);
                            resolve();
                        });
                    } else {
                        console.error(`Failed to download (hard): ${filename} (HTTP ${response.statusCode})`);
                        reject(`Failed to download (hard): ${filename}`);
                    }
                }).on('error', (err) => {
                    console.error(`Error downloading (hard) ${filename}: code 5`);
                    reject(`Error downloading (hard): ${filename}`);
                });
            });
            downloadPromises.push(promise);
        });
    
        // Process soft updates
        const softUpdateFiles = updateData[1];
        softUpdateFiles.forEach(([filename, url]) => {
            const promise = new Promise((resolve, reject) => {
                const filePath = path.join(__dirname, filename);
    
                if (fs.existsSync(filePath)) {
                    console.log(`Skipped (soft): ${filename} (already exists)`);
                    resolve();
                } else {
                    https.get(url, (response) => {
                        if (response.statusCode === 200) {
                            const fileStream = fs.createWriteStream(filePath);
                            response.pipe(fileStream);
    
                            fileStream.on('finish', () => {
                                fileStream.close();
                                console.log(`Updated (soft): ${filename}`);
                                resolve();
                            });
                        } else {
                            console.error(`Failed to download (soft): ${filename} (HTTP ${response.statusCode})`);
                            reject(`Failed to download (soft): ${filename}`);
                        }
                    }).on('error', (err) => {
                        console.error(`Error downloading (soft) ${filename}: code 5`);
                        reject(`Error downloading (soft): ${filename}`);
                    });
                }
            });
            downloadPromises.push(promise);
        });
        Promise.all(downloadPromises)
        .then(() => {
            console.log('Update done');
            if (reOpenAfterUpdate) {
                exec(`start ${path.join(__dirname, 'app.vbs')}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error: code 6`);
                    }
                    process.exit();
                });
            } else {
                process.exit();
            }
        })
        .catch((error) => {
            console.error('Update failed code 7');
            process.exit(1);
        });
    }
    const dirPath = 'C:\\Addon-Compiler-main';
    const files = ['install.bat', 'Add-On Compiler Download.vbs', 'README.md', '.gitignore', 'instruction.json', 'discord.vbs', 'BlockState-Add-On-Compiler.vbs'];

    if (process.cwd() === dirPath) {files.forEach(file => fs.existsSync(file) && (console.log(`${file} deleted.`), fs.unlinkSync(file)))} else {console.log('DEV mode detected.')};

})();
