const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron/main')
const path = require('node:path')

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    selectBluetoothCallback = callback
    const result = deviceList.find((device) => {
      return device.deviceName === 'test'
    })
    if (result) {
      callback(result.deviceId)
    } else {
      // The device wasn't found so we need to either wait longer (eg until the
      // device is turned on) or until the user cancels the request
    }
  })

  ipcMain.on('cancel-bluetooth-request', (event) => {
    selectBluetoothCallback('')
  })

  // Listen for a message from the renderer to get the response for the Bluetooth pairing.
  ipcMain.on('bluetooth-pairing-response', (event, response) => {
    bluetoothPinCallback(response)
  })

  mainWindow.webContents.session.setBluetoothPairingHandler((details, callback) => {
    bluetoothPinCallback = callback
    // Send a message to the renderer to prompt the user to confirm the pairing.
    mainWindow.webContents.send('bluetooth-pairing-request', details)
  })

  mainWindow.loadFile('index.html')
}

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('dark-mode:system', () => {
  nativeTheme.themeSource = 'system'
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
