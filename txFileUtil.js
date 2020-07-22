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

exports.canTxSignInfo = canTxSignInfo;
exports.checkTxFileInfo = checkTxFileInfo;
exports.getTxHex = getTxHex;
exports.getAuthorizationSignature = getAuthorizationSignature;
