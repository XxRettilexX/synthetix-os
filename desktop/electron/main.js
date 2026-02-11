import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

process.env.DIST = join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(__dirname, '../public')

let win;

const preload = join(__dirname, './preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Synthetix OS',
        width: 1200,
        height: 800,
        icon: join(process.env.VITE_PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: true,
        },
    })

    if (url) {
        win.loadURL(url)
        // win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})
