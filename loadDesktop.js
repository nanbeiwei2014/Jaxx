'use strict';
const electron = require('electron');
var path = require('path');
const app = electron.app;  
const BrowserWindow = electron.BrowserWindow;  

let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1050, 
    height: 730, 
    nodeIntegration: true,
    center: true,
    resizable: false,
    fullscreen : false,
    fullscreenable : false,
    title: 'Jaxx',
    frame: true,
    acceptFirstMouse: true,
    experimentalFeatures : true,
    icon: path.join(__dirname, '64.png'),
    webPreferences: {devTools: true}
  });
  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
   mainWindow.webContents.openDevTools();
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    app.quit();
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
