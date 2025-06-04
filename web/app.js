const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  win.loadURL(`file://${__dirname}/index.html`)
  // Remove this line to use the dev console
  win.removeMenu();
  win.maximize();
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  const filter = {
    urls: ['*://perch.birdtown.net/*']
  };
  const session = electron.remote.session
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      details.requestHeaders['Origin'] = "https://birdtown.net";
      details.headers['Origin'] = "https://birdtown.net";
      callback({ requestHeaders: details.requestHeaders })
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})