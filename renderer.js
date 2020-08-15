const { ipcRenderer } = require('electron');
const { readFile } = require('fs');
const { basename } = require('path');
const {
  canTxSignInfo, 
  checkTxFileInfo, 
  getTxHex, 
  getAuthorizationSignature,
  getTxid,
  getVout,
  getValueCommitment,
  getBip32Path,
  getRedeemScript,
  getDescriptor,
  getAddress,
  createTxInfo,
} = require('./txFileUtil');

const appNameTitle = 'ConnectApp';

function changeDisable(disabled, connectDisabled = undefined) {
  const fieldNames = [
    'outputTx',
    'outputSignature',
    'requestSign',
    'txFile',
    'selectFileName',
    'connectButton',
    'txid',
    'vout',
    'bip32Path',
    'commitment',
    'address',
    'redeemScript',
    'descriptor',
    'tx',
    'authSig',
  ];
  for (const name of fieldNames) {
    const field = document.getElementById(name);
    if (name === 'connectButton') {
      if (typeof connectDisabled === 'boolean') {
        field.disabled = connectDisabled;
      } else {
        field.disabled = disabled;
      }
    } else if ((!disabled) && (name === 'requestSign')) {
      const txInfo = createTxInfo(
        document.getElementById('tx').value,
        document.getElementById('authSig').value);
      field.disabled = !checkTxFileInfo(txInfo);
    } else {
      field.disabled = disabled;
    }
  }
}

function checkDisconnect(arg) {
  if (('disconnect' in arg) && (arg.disconnect ===  true)) {
    changeDisable(true, false);
    document.getElementById('app-name').innerHTML = `${appNameTitle}: -`;
    document.getElementById('connectResponse').value = arg.errorMessage;
    document.getElementById('connectButton').disabled = false;
    document.getElementById('outputSignature').value = '';
  } else {
    changeDisable(false, true);
  }
}

ipcRenderer.on("ledgerInfo", (event, arg) => {
  if (arg.success) {
    const ver = `v${arg.version.major}.${arg.version.minor}.${arg.version.patch}`
    document.getElementById('app-name').innerHTML = `${appNameTitle}: ${arg.name} (${ver})`;
    document.getElementById('connectResponse').value = 'connected';
    changeDisable(false, true);
    document.getElementById('outputSignature').value = '';
    document.getElementById('outputTx').value = '';
  } else {
    changeDisable(true, false);
    document.getElementById('app-name').innerHTML = 'name: -';
    document.getElementById('connectResponse').value = arg.errorMessage;
    document.getElementById('connectButton').disabled = false;
  }
});

ipcRenderer.on("responseTxSign", (event, result) => {
  if ('signInfo' in result) {
    document.getElementById('outputSignature').value = result.signInfo.signatureList[0].signature;
    if (result.signInfo.hasAddedSignatureToTxHex[0] === true) {
      document.getElementById('outputTx').value = result.signInfo.txHex;
      document.getElementById('tx').value = result.signInfo.txHex;
    } else {
      document.getElementById('outputTx').value = 'Inserting signatures on the Transaction is not supported by this script.';
    }
    changeDisable(false, true);
  } else {
    document.getElementById('outputSignature').value = result.errorMessage;
    document.getElementById('outputTx').value = '';
    checkDisconnect(result);
  }
});

document.getElementById('connectButton').addEventListener('click', () => {
  changeDisable(true);
  document.getElementById('connectResponse').value = 'check connection...';
  ipcRenderer.send('requestLedgerInfo');
});

document.getElementById('requestSign').addEventListener('click', () => {
  const txInfo = createTxInfo(
    document.getElementById('tx').value,
    document.getElementById('authSig').value);
  if (!canTxSignInfo(txInfo)) {
    alert('require field is empty. (txid, vout, commitment, bip32Path)');
    return;
  }
  const signUtxoData = {
    txid: document.getElementById('txid').value,
    vout: parseInt(document.getElementById('vout').value),
    valueCommitment: document.getElementById('commitment').value,
    bip32Path: document.getElementById('bip32Path').value,
    redeemScript: document.getElementById('redeemScript').value,
    descriptor: document.getElementById('descriptor').value,
    address: document.getElementById('address').value,
  };
  document.getElementById('txFile').disabled = true;
  document.getElementById('requestSign').disabled = true;
  document.getElementById('outputSignature').value = 'during sign...';
  document.getElementById('outputTx').value = '';
  ipcRenderer.send('requestTxSign', txInfo, signUtxoData);
});

document.getElementById('txFile').addEventListener('click', () => {
  const remote = require('electron').remote;
  const dialog = remote.dialog;
  const focusedWindow = remote.BrowserWindow.getFocusedWindow();
  try {
    dialog.showOpenDialog(focusedWindow, {
      title: 'transaction json file',
      properties: ['openFile'],
      filters: [{
        name: 'txJsonFile',
        extensions: ['json']
      }]
    }).then((value) => {
      if (value.canceled) {
        return;
      }
      if (value.bookmarks) {
        console.log(value.bookmarks);
      }
      
      const files = value.filePaths;
      if (files.length > 0) {
        readFile(files[0], {encoding: 'utf-8'}, (err, data)=>{
          try {
            if(err) {
              document.getElementById('selectFileName').value = err;
            } else if (!checkTxFileInfo(JSON.parse(data))) {
              document.getElementById('selectFileName').value = 'Invalid tx json file.';
            } else {
              const txFileInfo = JSON.parse(data);
              document.getElementById('requestSign').disabled = false;
              document.getElementById('selectFileName').value = basename(files[0]);
              document.getElementById('tx').value = getTxHex(txFileInfo);
              document.getElementById('authSig').value = getAuthorizationSignature(txFileInfo);
              document.getElementById('txid').value = getTxid(txFileInfo);
              document.getElementById('vout').value = getVout(txFileInfo);
              document.getElementById('commitment').value = getValueCommitment(txFileInfo);
              document.getElementById('bip32Path').value = getBip32Path(txFileInfo);
              document.getElementById('redeemScript').value = getRedeemScript(txFileInfo);
              document.getElementById('descriptor').value = getDescriptor(txFileInfo);
              document.getElementById('address').value = getAddress(txFileInfo);
            }
          } catch (except) {
            console.log(except);
            document.getElementById('selectFileName').value = 'Invalid json file.';
          }
        });
      }
    }).catch(e => {
      console.log(e);
      document.getElementById('selectFileName').value = e.toString();
    });
  } catch (e) {
    console.log(e);
    document.getElementById('selectFileName').value = e.toString();
  }
});

// first execute
document.getElementById('connectButton').disabled = true;
changeDisable(true);
document.getElementById('connectResponse').value = 'check connection...';
ipcRenderer.send('requestLedgerInfo');
