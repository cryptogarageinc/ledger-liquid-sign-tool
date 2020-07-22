const childProcess = require("child_process")
const builder = require("electron-builder")

const appVersion = (process.argv.length > 2) ?
  process.argv[2] : childProcess.execSync("npm run appVersion --silent").toString().trim();

builder.build({
  config: {
    buildVersion: "0.0.0", // 変更不要: ここは Windows 用に指定しています。
    extraMetadata: {
      version: appVersion,
    },
  }
})
