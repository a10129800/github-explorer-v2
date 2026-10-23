const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 統一應用程式名稱與 UserData 目錄 (避免 Windows 下名稱分歧)
app.name = 'GitHub Explorer V2';
const customUserData = path.join(app.getPath('appData'), 'GitHub Explorer V2');
app.setPath('userData', customUserData);

const { NextServerManager } = require('./serverManager');

// 單一執行個體鎖定：避免使用者重複雙擊開啟多重視窗
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let splashWindow = null;
let serverManager = null;
let isMainWindowShown = false;

function getAppIcon() {
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../public/icon.ico'),
    path.join(process.resourcesPath || '', 'icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../public/icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return undefined;
}

// 建立啟動載入視窗 (Splash Screen)
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 460,
    height: 360,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    show: false,
    icon: getAppIcon(),
    backgroundColor: '#080c14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
}

function updateSplashText(text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(`
      if (typeof updateStatusText === 'function') {
        updateStatusText(${JSON.stringify(text)});
      }
    `).catch(() => {});
  }
}

// 切換展示主視窗並關閉 Splash
function showMainWindowSafely() {
  if (isMainWindowShown || !mainWindow || mainWindow.isDestroyed()) return;
  isMainWindowShown = true;

  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  mainWindow.show();
  mainWindow.focus();

  if (serverManager) {
    serverManager.logInfo('主視窗已切換展示完畢');
  }
}

// 建立主視窗
function createMainWindow(port) {
  const iconPath = getAppIcon();
  isMainWindowShown = false;

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#080c14',
    title: 'GitHub Explorer V2 — 開源專案雷達',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const appUrl = `http://127.0.0.1:${port}`;
  if (serverManager) {
    serverManager.logInfo(`主視窗載入網址: ${appUrl}`);
  }

  mainWindow.loadURL(appUrl);

  // 1. ready-to-show 事件
  mainWindow.once('ready-to-show', () => {
    showMainWindowSafely();
  });

  // 2. did-finish-load 事件保險
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(showMainWindowSafely, 300);
  });

  // 3. 5 秒最大超時強制切換保險 (避免頁面資源因外鏈等原因卡住 ready-to-show)
  setTimeout(() => {
    if (!isMainWindowShown && mainWindow && !mainWindow.isDestroyed()) {
      if (serverManager) {
        serverManager.logInfo('觸發 5 秒保險機制強制展示主視窗');
      }
      showMainWindowSafely();
    }
  }, 5000);

  // 頁面加載失敗處理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (serverManager) {
      serverManager.logWarn('主視窗載入發生 did-fail-load', { errorCode, errorDescription, validatedURL });
    }
    // 延遲重試
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !isMainWindowShown) {
        mainWindow.loadURL(appUrl);
      }
    }, 1500);
  });

  // 安全防護：攔截外部連結並以系統預設瀏覽器開啟 (如 GitHub Repo 連結)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 應用程式初始化生命週期
app.whenReady().then(async () => {
  createSplashWindow();

  serverManager = new NextServerManager({
    app,
    onStatusUpdate: (msg) => {
      updateSplashText(msg);
    }
  });

  serverManager.logInfo('=== 應用程式啟動 ===', {
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    execPath: process.execPath,
  });

  try {
    const port = await serverManager.start();
    await serverManager.waitForReady(35000);
    createMainWindow(port);
  } catch (err) {
    const diag = serverManager ? serverManager.getLastDiagnostics() : {};
    const safeErrorMsg = (err.message || '未知錯誤').replace(/[`\\$]/g, '');
    const logPathDisplay = (diag.startupLogPath || '').replace(/\\/g, '/');

    if (serverManager) {
      serverManager.logError('應用程式啟動流程失敗', { error: err.message, stack: err.stack, diag });
    }

    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(`
        if (typeof showStartupError === 'function') {
          showStartupError(${JSON.stringify(safeErrorMsg)}, ${JSON.stringify(logPathDisplay)});
        }
      `).catch(() => {});
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (serverManager && serverManager.port) {
        createMainWindow(serverManager.port);
      }
    }
  });
});

// 重複執行個體喚起
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// 視窗全關閉退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 退出時徹底終止本機伺服器程序
app.on('before-quit', () => {
  if (serverManager) {
    serverManager.stop();
  }
});

app.on('will-quit', () => {
  if (serverManager) {
    serverManager.stop();
  }
});

// 全域未捕獲異常防護
process.on('uncaughtException', (err) => {
  if (serverManager) {
    serverManager.logError('主程序未捕獲異常 (uncaughtException)', { error: err.message, stack: err.stack });
  } else {
    console.error('uncaughtException:', err);
  }
});

process.on('unhandledRejection', (reason) => {
  if (serverManager) {
    serverManager.logError('主程序未處理 Rejection (unhandledRejection)', { reason });
  } else {
    console.error('unhandledRejection:', reason);
  }
});

// IPC 輔助處理
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:get-user-data-path', () => app.getPath('userData'));
ipcMain.handle('app:get-log-dir', () => (serverManager ? serverManager.logDir : path.join(app.getPath('userData'), 'logs')));
ipcMain.on('app:open-log-dir', () => {
  const dir = serverManager ? serverManager.logDir : path.join(app.getPath('userData'), 'logs');
  if (fs.existsSync(dir)) {
    shell.openPath(dir);
  }
});
ipcMain.on('app:client-log', (event, { level, message, data }) => {
  if (serverManager) {
    serverManager.writeLog(level || 'INFO', `[Client] ${message}`, data);
  }
});
ipcMain.on('window:minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow && mainWindow.close());
ipcMain.on('shell:open-external', (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});
