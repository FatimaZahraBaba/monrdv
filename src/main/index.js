import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import icon from '../../resources/icon.png?asset'
import { Bonjour } from 'bonjour-service'
//import startLocalServer from './server'

log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = false;

const bonjour = new Bonjour();
let serverIP = null;

const browser = bonjour.find({ type: 'podopro' }, (service) => {
  if (service.port === 4000) {
    serverIP = service.referer.address;
    bonjour.destroy();
  }
});

// Handle errors on the bonjour instance itself
bonjour._server?.on('error', (err) => {
  console.error('Bonjour server error:', err);
});

// Handle errors gracefully
browser.on('error', (err) => {
  console.error('Bonjour error:', err);
});

setTimeout(() => {
  if (!serverIP) {
    //startLocalServer();
  }
}, 3000);

ipcMain.handle('get-server-ip', () => {
  return serverIP;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  try {
    if (process.platform !== 'win32') {
      return { updateAvailable: false };
    }

    const result = await autoUpdater.checkForUpdates();
    return {
      updateAvailable: !!result?.updateInfo?.version && result.updateInfo.version !== app.getVersion(),
      version: result?.updateInfo?.version
    };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    const result = await autoUpdater.downloadUpdate();
    return result;
  } catch (error) {
    return { error: error.message };
  }
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: true,
    title: "MonRDV",
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show()
    //process.env.NODE_ENV === 'development' && mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  const mainWindow = createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  mainWindow.on("close", () => {
    mainWindow.webContents.send('app-before-quit')
  })

  if (app.isPackaged && process.platform === 'win32') {
    //autoUpdater.forceDevUpdateConfig = true
    autoUpdater.checkForUpdatesAndNotify()
  }
})

app.on('before-quit', () => {
  bonjour.unpublishAll(() => bonjour.destroy());
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit()
  // if (process.platform !== 'darwin') {
  // }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on("silent-print", async (event, { content, rectoVerso }) => {
  const printWindow = new BrowserWindow({
    show: false,
  });

  printWindow.webContents.once("did-finish-load", () => {
    printWindow.webContents.print({
      silent: true,
      printBackground: true,
      margins: { marginType: "none" },
      duplexMode: rectoVerso ? "longEdge" : "simplex"
    }, () => {
      printWindow.close();
    });
  });

  printWindow.loadURL(`data:text/html,${encodeURIComponent(content)}`);
});
