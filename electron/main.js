const { app, BrowserWindow } = require('electron');

const path = require('path');
const url = require('url');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: "Crush Domains",
    });

    // Load the index.html from the out directory
    const indexPath = path.join(__dirname, '../out/index.html');

    win.loadURL(
        url.format({
            pathname: indexPath,
            protocol: 'file:',
            slashes: true,
        })
    );

    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
