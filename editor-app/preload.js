const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // БД
  loadDB: () => ipcRenderer.invoke("load-db"),
  saveData: (json) => ipcRenderer.invoke("save-db", json),

  // Тэги
  loadTags: () => ipcRenderer.invoke("load-tags"),

  // Папки
  createFolder: (folderPath) => ipcRenderer.invoke("create-folder", folderPath),
  renameFolder: (oldPath, newPath) =>
    ipcRenderer.invoke("rename-folder", oldPath, newPath),
  deleteFolder: (folderPath) => ipcRenderer.invoke("delete-folder", folderPath),

  // Текст
  readTextFile: (filePath) => ipcRenderer.invoke("read-text-file", filePath),
  writeTextFile: (filePath, content) =>
    ipcRenderer.invoke("write-text-file", filePath, content),
});
