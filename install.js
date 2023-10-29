const { exec } = require('child_process');
exec('npm i', (e, s) => console.log(e ? `Error: ${e}` : 'Dependencies installed successfully.'));