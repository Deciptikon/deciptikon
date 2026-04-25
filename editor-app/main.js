const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const DB_PATH = "../test_db.json"; //path.join(__dirname, "..", "test_db.json"); // <-- путь к твоей тестовой БД
const ROOT_DIR = path.join(__dirname, "..");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Menu.setApplicationMenu(null);  // раскомментируешь позже
  win.loadFile("index.html");
}

// IPC-обработчики для операций с БД и папками
ipcMain.handle("load-db", async () => {
  try {
    console.log("load... DB");

    if (!fs.existsSync(DB_PATH)) return { meta: {}, data: [] };
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(raw);

    console.log(db);

    return db;
  } catch (e) {
    console.error(e);
    return { meta: {}, data: [] };
  }
});

ipcMain.handle("save-data", async (event, jsonObject) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(jsonObject, null, 2), "utf-8");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("create-folder", async (event, folderPath) => {
  try {
    const absPath = path.isAbsolute(folderPath)
      ? folderPath
      : path.join(ROOT_DIR, folderPath);
    if (!absPath.startsWith(ROOT_DIR))
      throw new Error("Путь вне допустимой области");
    if (!fs.existsSync(absPath)) {
      fs.mkdirSync(absPath, { recursive: true });
      return { success: true };
    }
    return { success: false, error: "Папка уже существует" };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("rename-folder", async (event, oldPath, newPath) => {
  try {
    const absOld = path.isAbsolute(oldPath)
      ? oldPath
      : path.join(ROOT_DIR, oldPath);
    const absNew = path.isAbsolute(newPath)
      ? newPath
      : path.join(ROOT_DIR, newPath);
    if (!absOld.startsWith(ROOT_DIR) || !absNew.startsWith(ROOT_DIR))
      throw new Error("Выход за пределы");
    fs.renameSync(absOld, absNew);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("delete-folder", async (event, folderPath) => {
  try {
    const absPath = path.isAbsolute(folderPath)
      ? folderPath
      : path.join(ROOT_DIR, folderPath);
    if (!absPath.startsWith(ROOT_DIR)) throw new Error("Выход за пределы");
    fs.rmSync(absPath, { recursive: true, force: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
