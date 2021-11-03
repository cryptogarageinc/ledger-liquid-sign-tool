const appNameTitle = 'ConnectApp';

const checkTxFileInfo = function(target) {
  if (('tx' in target) && ('authorizationSignature' in target) &&
      (typeof target.tx == 'string') &&
      (typeof target.authorizationSignature == 'string') &&
      (target.tx.length > 0) && (target.authorizationSignature.length > 0)) {
    return true;
  }
  return false;
}

const canTxSignInfo = function(target) {
  if (checkTxFileInfo(target)) {
    const signUtxoData = {
      txid: document.getElementById('txid').value,
      vout: document.getElementById('vout').value,
      valueCommitment: document.getElementById('commitment').value,
      bip32Path: document.getElementById('bip32Path').value,
      redeemScript: document.getElementById('redeemScript').value,
      descriptor: document.getElementById('descriptor').value,
      address: document.getElementById('address').value,
    };
    if ((signUtxoData.txid.length > 0) && (signUtxoData.valueCommitment.length > 0) && (signUtxoData.bip32Path.length > 0)) {
      return true;
    }
  }
  return false;
}

const getTxHex = function(jsonData) {
  if (checkTxFileInfo(jsonData)) {
    return jsonData.tx;
  }
  throw new Error('Invalid tx json file format.');
}

const getAuthorizationSignature = function(jsonData) {
  if (checkTxFileInfo(jsonData)) {
    return jsonData.authorizationSignature;
  }
  throw new Error('Invalid tx json file format.');
}

const createTxInfo = function(tx, authSig) {
  return {
    tx,
    authorizationSignature: authSig,
  };
}


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

window.signToolApi.on("ledgerInfo", (event, arg) => {
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

window.signToolApi.on("responseTxSign", (event, result) => {
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
  window.signToolApi.requestLedgerInfo();
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
  window.signToolApi.requestTxSign(txInfo, signUtxoData);
});

document.getElementById('txFile').addEventListener('click', () => {
  window.signToolApi.requestFileSelect();
});

window.signToolApi.on("responseFileSelect", (event, result) => {
  if ('txFileInfo' in result) {
    document.getElementById('requestSign').disabled = false;
    document.getElementById('selectFileName').value = result.selectFileName;
    document.getElementById('tx').value = getTxHex(result.txFileInfo);
    document.getElementById('authSig').value = getAuthorizationSignature(result.txFileInfo);

    // cleanup
    document.getElementById('txid').value = '';
    document.getElementById('vout').value = '0';
    document.getElementById('commitment').value = '';
    document.getElementById('bip32Path').value = 'm/44h/0h/0h/0/0';
    document.getElementById('redeemScript').value = '';
    document.getElementById('descriptor').value = '';
    document.getElementById('address').value = '';
  } else if ('selectFileName' in result) {
    document.getElementById('selectFileName').value = result.selectFileName;
  }
});

try {
  // first execute
  document.getElementById('connectButton').disabled = true;
  changeDisable(true);
  document.getElementById('connectResponse').value = 'check connection...';
  window.signToolApi.requestLedgerInfo();
} catch (e) {
  console.log(e);
}
