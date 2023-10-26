const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const archiver = require('archiver');
const express = require('express');
const https = require('https');
const app = express();
let keepOpenState = true;
function updateApp() {
    console.log("Updating app");
    process.exit();
};
function addonProject(array1, array2) {
    const exclusiveTo1 = array1.filter(element => !array2.includes(element)).map(element => element + " RP");
    const commonElements = array1.filter(element => array2.includes(element)).map(element => element + " Addon");
    const exclusiveTo2 = array2.filter(element => !array1.includes(element)).map(element => element + " BP");
    return [exclusiveTo1, commonElements, exclusiveTo2];
};
let currentVersion = fs.readFileSync(path.join(__dirname, 'version.txt'), 'utf8');
console.log(currentVersion);
https.get("https://raw.githubusercontent.com/Andinh123/Addon-Compiler/main/app.vbs", (response) => {
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
}).on('error', (error) => {
    console.error(`Error fetching data: ${error.message}`);
});
let RPprojects = [];
fs.readdirSync(path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs')).forEach(rpFolder => {
    RPprojects.push(rpFolder.replace(/ RP$/, ''));
});
let BPprojects = [];
fs.readdirSync(path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs')).forEach(bpFolder => {
    BPprojects.push(bpFolder.replace(/ BP$/, ''));
});
app.use(express.json());
app.use(express.static('public'));
app.get('/data', (req, res) => {
    res.send(addonProject(RPprojects, BPprojects));
});
app.post('/action/:parameter', (req, res) => {
    const parameter = req.params.parameter.replace(/ (BP|RP|Addon)$/, '');
    console.log(parameter);
    createAddon(parameter);
    res.send(`Action ${parameter} received`);
});
  
app.listen('80', () => {});


(async () => {
    const browser = await puppeteer.launch({
        headless: false, 
        defaultViewport: null,
        executablePath:"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: [
            '--disable-infobars',
            '--start-maximized',
            '--app=http://localhost'
            ],
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection'],
    });
    browser.on('disconnected', () => {
        if (keepOpenState === false) {
            process.exit();
        } else {
            updateApp();
        }
    });
})();

function createAddon(projectName) {
    const basePath = path.join(process.env.USERPROFILE, 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang');
    const addonZipPath = path.join(process.env.USERPROFILE, 'Desktop', `${projectName} Addon.mcaddon`);
    let BPpath, RPpath;
    if (fs.existsSync(path.join(basePath, 'development_behavior_packs', projectName + ' BP'))) {
        BPpath = path.join(basePath, 'development_behavior_packs', projectName + ' BP')
    } else {
        BPpath = path.join(basePath, 'development_behavior_packs', projectName)
    };

    if (fs.existsSync(path.join(basePath, 'development_resource_packs', projectName + ' RP'))) {
        RPpath = path.join(basePath, 'development_resource_packs', projectName + ' RP')
    } else {
        RPpath = path.join(basePath, 'development_resource_packs', projectName)
    }
    const inputFolders = [
        { name: projectName + ' BP', path: BPpath},
        { name: projectName + ' RP', path: RPpath}
    ];
    const output = fs.createWriteStream(addonZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
        console.log(`Successfully created: ${addonZipPath}`);
    });
    archive.pipe(output);
    inputFolders.forEach(folderInfo => {
        archive.directory(folderInfo.path, folderInfo.name);
    });
    archive.finalize();
}