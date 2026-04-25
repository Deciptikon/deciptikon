const { contextBridge } = require("electron");
const fs = require("fs");
const path = require("path");

// Путь к вашему JSON относительно папки editor-app
const DATA_PATH = path.join(__dirname, "..", "test_db.json");

contextBridge.exposeInMainWorld("api", {
  loadData: () => {
    try {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("Ошибка чтения data.json:", e);
      return { meta: {}, data: [] };
    }
  },
  saveData: (jsonObject) => {
    try {
      fs.writeFileSync(DATA_PATH, JSON.stringify(jsonObject, null, 2), "utf-8");
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },
});
