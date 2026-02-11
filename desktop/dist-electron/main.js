import { app as n, BrowserWindow as t } from "electron";
import { join as o } from "node:path";
process.env.DIST = o(__dirname, "../dist");
process.env.VITE_PUBLIC = n.isPackaged ? process.env.DIST : o(__dirname, "../public");
let e;
const c = o(__dirname, "./preload.js"), s = process.env.VITE_DEV_SERVER_URL, l = o(process.env.DIST, "index.html");
async function r() {
  e = new t({
    title: "Synthetix OS",
    width: 1200,
    height: 800,
    icon: o(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: c,
      nodeIntegration: !0,
      contextIsolation: !0
    }
  }), s ? e.loadURL(s) : e.loadFile(l);
}
n.whenReady().then(r);
n.on("window-all-closed", () => {
  e = null, process.platform !== "darwin" && n.quit();
});
n.on("second-instance", () => {
  e && (e.isMinimized() && e.restore(), e.focus());
});
n.on("activate", () => {
  const i = t.getAllWindows();
  i.length ? i[0].focus() : r();
});
