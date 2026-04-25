const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  loadDB: () => ipcRenderer.invoke("load-db"),
  saveData: (json) => ipcRenderer.invoke("save-data", json),
  createFolder: (folderPath) => ipcRenderer.invoke("create-folder", folderPath),
  renameFolder: (oldPath, newPath) =>
    ipcRenderer.invoke("rename-folder", oldPath, newPath),
  deleteFolder: (folderPath) => ipcRenderer.invoke("delete-folder", folderPath),
});
