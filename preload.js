const { ipcRenderer, contextBridge } = require('electron');
const path = require('path');

// https://qiita.com/pochman/items/62de713a014dcacbad68
contextBridge.exposeInMainWorld(
  'signToolApi',
  {
    requestTxSign: (txInfo, signUtxoData) => {
      ipcRenderer.send('requestTxSign', txInfo, signUtxoData);
    },
    requestFileSelect: () => {
      ipcRenderer.send('requestFileSelect');
    },
    requestLedgerInfo: () => {
      ipcRenderer.send('requestLedgerInfo');
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    }
  }
)
