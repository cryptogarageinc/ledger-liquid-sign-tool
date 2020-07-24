// Modules to control application life and create native browser window
const LedgerLib = require("ledger-liquid-lib-simple");
const signLib = require("ledger-liquid-lib-simple/sign-lib");

const { app, BrowserWindow, ipcMain } = require("electron");

const path = require('path');
const url = require('url');
const CfdJs = require('cfd-js-wasm');

const { getTxHex, getAuthorizationSignature } = require('./txFileUtil');

let lastConnectedApp = LedgerLib.ApplicationType.Empty;

// This a very basic example
// Ideally you should not run this code in main thread
// but run it in a dedicated node.js process
function getLedgerInfo() {
  console.log('getLedgerInfo call.');
  const liquidLib = new LedgerLib.LedgerLiquidWrapper('liquidv1');
  return liquidLib.connect(10, '')
    .then(status => {
      if (status.success) {
        return liquidLib.getApplicationInfo().then(result => {
          if (result.success) {
            lastConnectedApp = result.name;
          }
          return result;
        });
      }
      console.log('connect fail. ', status);
      return status;
    })
    .finally(() => {
      return liquidLib.disconnect().then(() => {
        console.log('getLedgerInfo disconnect.')
      });
    });
}

function signTx(txFileInfo, signUtxoData) {
  console.log('signTx call:', txFileInfo);
  const tx = getTxHex(txFileInfo);
  const authSig = getAuthorizationSignature(txFileInfo);
  const netType =
      (lastConnectedApp === LedgerLib.ApplicationType.LiquidHeadless) ?
          LedgerLib.NetworkType.LiquidV1 : LedgerLib.NetworkType.Regtest;
  const liquidLib = new LedgerLib.LedgerLiquidWrapper(netType, true);
  return liquidLib.connect(0, '')
    .then(status => {
      if (status.success) {
        const signUtil = new signLib.LedgerSignUtil(CfdJs.getCfd());
        console.log('authSig:', authSig);
        console.log('signUtxoData:', signUtxoData);
        return signUtil.sign(liquidLib, tx, authSig, [signUtxoData]).then(result => {
          status['signInfo'] = result;
          return status;
        });
      }
      console.log('connect fail. ', status);
      return status;
    })
    .catch(e => {
      console.warn(e);
      return {errorMessage: e.toString()};
    })
    .finally(() => {
      return liquidLib.disconnect().then(() => {
        console.log('signTx disconnect.')
      });
    });
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
     webPreferences: {
      nodeIntegration: true
    }, width: 800, height: 660 });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // ~~~ BASIC LEDGER EXAMPLE ~~~

  ipcMain.on("requestLedgerInfo", (event) => {
    getLedgerInfo().then(result => {
      console.log('ledgerInfo');
      console.log(result);
      mainWindow.webContents.send("ledgerInfo", result);
    });
  });

  ipcMain.on("requestTxSign", (event, txFileInfo, signUtxoData) => {
    signTx(txFileInfo, signUtxoData).then(result => {
      console.log('signTx');
      console.log(result);
      mainWindow.webContents.send("responseTxSign", result);
    });
  });

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
}

// https://github.com/electron/electron/issues/18397
app.allowRendererProcessReuse = true;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
