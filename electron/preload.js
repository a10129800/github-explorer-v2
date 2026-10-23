const { contextBridge, ipcRenderer } = require('electron');

// 嚴格沙箱化 Preload：僅暴露有限、安全的桌面輔助介面
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  openExternal: (url) => ipcRenderer.send('shell:open-external', url),
  getUserDataPath: () => ipcRenderer.invoke('app:get-user-data-path'),
  openLogDir: () => ipcRenderer.send('app:open-log-dir'),
  logToHost: (level, message, data) => ipcRenderer.send('app:client-log', { level, message, data }),
});
