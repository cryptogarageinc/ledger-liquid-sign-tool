# ledger-liquid-sign-tool

## Run

```bash
yarn
yarn start
```

## Operation (p2wpkh)

  1. ledger connect. (Open ledger liquid Test Hless application.)
  2. click connect button. (or open application)
  3. set transaction json file.
     format:
     ```
     {
       "tx": "<tx hex>",
       "authorizationSignature": "<auth signature>"
     }
     ```
  4. input parameter. (txid, vout, commitment, bip32 path).
  5. input descriptor or address.
  6. click request sign.
  7. copy from output transaction hex.
