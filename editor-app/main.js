const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Корень проекта
const ROOT_DIR = path.join(__dirname, "..");

// Путь к БД
const DB_PATH = `${ROOT_DIR}\\db.json`;
console.log("DB_PATH =", DB_PATH);

// Путь к тегам
const TAGS_PATH = `${ROOT_DIR}\\pages\\poetry\\core-tags.json`;
console.log("TAGS_PATH =", TAGS_PATH);

// Проверка безопасности пути
function isSafePath(targetPath) {
  const resolved = path.resolve(targetPath);
  return resolved.startsWith(ROOT_DIR);
}

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
  Menu.setApplicationMenu(null);
  win.loadFile("index.html");
}

// === IPC: БД ===
ipcMain.handle("load-db", async () => {
  try {
    if (!fs.existsSync(DB_PATH)) return { meta: {}, data: [] };
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error(e);
    return { meta: {}, data: [] };
  }
});

ipcMain.handle("save-db", async (event, jsonObject) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(jsonObject, null, 2), "utf-8");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// === IPC: папки ===
ipcMain.handle("create-folder", async (event, folderPath) => {
  try {
    const absPath = path.isAbsolute(folderPath)
      ? folderPath
      : path.join(ROOT_DIR, folderPath);
    if (!isSafePath(absPath)) throw new Error("Путь вне допустимой области");
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
    if (!isSafePath(absOld) || !isSafePath(absNew))
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
    if (!isSafePath(absPath)) throw new Error("Выход за пределы");
    fs.rmSync(absPath, { recursive: true, force: true });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// === IPC: текст ===
ipcMain.handle("read-text-file", async (event, relativePath) => {
  try {
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (!fullPath.startsWith(ROOT_DIR)) throw new Error("Недопустимый путь");
    if (!fs.existsSync(fullPath)) return "";
    return fs.readFileSync(fullPath, "utf-8");
  } catch (e) {
    console.error(e);
    return "";
  }
});

ipcMain.handle("write-text-file", async (event, relativePath, content) => {
  try {
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (!fullPath.startsWith(ROOT_DIR)) throw new Error("Недопустимый путь");
    fs.writeFileSync(fullPath, content, "utf-8");
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("load-tags", async () => {
  try {
    if (!fs.existsSync(TAGS_PATH)) return [];
    const raw = fs.readFileSync(TAGS_PATH, "utf-8");
    const data = JSON.parse(raw);
    return data.tags || [];
  } catch (e) {
    console.error(e);
    return [];
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
