const childProcess = require("child_process")
const regexp = new RegExp("^[0-9.]*$")

const latestTagVersion = childProcess.execSync("git tag -l --sort -version:refname").toString().split(/\r\n|\r|\n/).find(s => {
  return s.match(regexp)
}) || "0.0.0"
const latestHash = childProcess.execSync("git rev-parse --short HEAD").toString().trim()

console.log(`${latestTagVersion}+${latestHash}`)
