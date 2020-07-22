const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  const appName = context.packager.appInfo.productFilename;

  const isMac = electronPlatformName === 'darwin';
  if (!isMac) {
    return;
  }

  const isPackageTest = !!process.env.PLM_PACKAGE_TEST;
  if (isPackageTest) {
    return;
  }

  await notarize({
    appBundleId: 'io.settlenet.xpubviewer',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  });
};
