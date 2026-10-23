const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, execSync } = require('child_process');

class NextServerManager {
  constructor(options = {}) {
    this.app = options.app;
    this.isPackaged = this.app ? this.app.isPackaged : false;
    this.serverProcess = null;
    this.port = null;
    this.onStatusUpdate = options.onStatusUpdate || (() => {});

    // 統一使用者目錄名稱為 "GitHub Explorer V2"
    this.userDataPath = options.userDataPath || (this.app ? this.app.getPath('userData') : path.join(process.env.APPDATA || '', 'GitHub Explorer V2'));
    this.logDir = path.join(this.userDataPath, 'logs');
    this.dbPath = path.join(this.userDataPath, 'radar.db');
    this.startupLogPath = path.join(this.logDir, 'startup.log');
    this.serverLogPath = path.join(this.logDir, 'server.log');

    // 狀態追蹤
    this.hasExitedEarly = false;
    this.exitCode = null;
    this.exitSignal = null;
    this.lastError = null;
    this.recentStderrLines = [];
    this.recentStdoutLines = [];

    this.ensureDirectories();
    this.logInfo('NextServerManager 初始化完成', {
      isPackaged: this.isPackaged,
      resourcesPath: process.resourcesPath,
      userDataPath: this.userDataPath,
      dbPath: this.dbPath,
    });
  }

  ensureDirectories() {
    try {
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
      }
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.error('[ServerManager] 建立目錄失敗:', err);
    }
  }

  /**
   * 結構化寫入診斷日誌 (安全防護：不得記錄任何 Token 或密碼)
   */
  writeLog(level, message, data = null) {
    const time = new Date().toISOString();
    let safeData = null;
    if (data) {
      try {
        const str = JSON.stringify(data, (key, value) => {
          if (/token|password|secret|auth|cookie/i.test(key)) {
            return '[REDACTED]';
          }
          return value;
        });
        safeData = str;
      } catch {
        safeData = '[Serialization failed]';
      }
    }

    let line = `[${time}] [${level}] ${message}`;
    if (safeData) {
      line += ' ' + safeData;
    }
    line += '\n';

    if (level === 'ERROR') {
      console.error(line.trim());
    } else if (level === 'WARN') {
      console.warn(line.trim());
    } else {
      console.log(line.trim());
    }

    try {
      fs.appendFileSync(this.startupLogPath, line, 'utf8');
    } catch {
      // 避免日誌寫入失敗阻斷主程序
    }
  }

  logInfo(message, data) {
    this.writeLog('INFO', message, data);
  }

  logWarn(message, data) {
    this.writeLog('WARN', message, data);
  }

  logError(message, data) {
    this.writeLog('ERROR', message, data);
  }

  /**
   * 格式化 SQLite DATABASE_URL (依 Prisma 規範轉義空格，避免 Windows 路徑解析崩潰)
   */
  getDatabaseUrl() {
    const normalized = this.dbPath.replace(/\\/g, '/').replace(/ /g, '%20');
    return `file:${normalized}`;
  }

  /**
   * 安全初始化 SQLite 資料庫：絕不覆蓋、刪除現有正式資料
   */
  ensureDatabase() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const stats = fs.statSync(this.dbPath);
        this.logInfo('檢測到已存在的正式版資料庫，安全保留既有資料', {
          dbPath: this.dbPath,
          sizeBytes: stats.size,
          lastModified: stats.mtime
        });
        return;
      }

      this.logInfo('首次啟動，準備初始化資料庫', { targetPath: this.dbPath });

      const candidatePaths = [
        path.join(process.resourcesPath || '', 'standalone', 'prisma', 'template.db'),
        path.join(process.resourcesPath || '', 'standalone', 'dev.db'),
        path.join(process.resourcesPath || '', 'dev.db'),
        path.join(__dirname, '..', 'dev.db'),
        path.join(__dirname, '..', 'prisma', 'template.db')
      ];

      let copied = false;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          fs.copyFileSync(p, this.dbPath);
          this.logInfo('已成功繼承範本資料庫', { source: p, target: this.dbPath });
          copied = true;
          break;
        }
      }

      if (!copied) {
        fs.writeFileSync(this.dbPath, '');
        this.logInfo('已建立初始空 SQLite 檔案，後續由 Prisma 安全建立結構', { dbPath: this.dbPath });
      }
    } catch (err) {
      this.logError('資料庫初始化異常', { error: err.message });
    }
  }

  /**
   * 尋找可用的 Next.js Standalone server.js 入口
   */
  findServerScript() {
    const candidates = [];

    if (this.isPackaged) {
      // 1. extraResources: resources/standalone/server.js (解壓後純實體目錄)
      candidates.push(path.join(process.resourcesPath, 'standalone', 'server.js'));
      // 2. 備用：resources/.next/standalone/server.js
      candidates.push(path.join(process.resourcesPath, '.next', 'standalone', 'server.js'));
      // 3. 備用：app.asar.unpacked 目錄
      candidates.push(path.join(process.resourcesPath, 'app.asar.unpacked', '.next', 'standalone', 'server.js'));
      // 4. 備用：app 目錄
      candidates.push(path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js'));
    }

    // 開發或降級路徑
    candidates.push(path.join(__dirname, '..', '.next', 'standalone', 'server.js'));
    candidates.push(path.join(__dirname, '..', 'standalone', 'server.js'));

    this.logInfo('正在探測 Standalone 伺服器入口候選路徑...');

    for (const p of candidates) {
      const exists = fs.existsSync(p);
      this.logInfo(`檢查伺服器路徑: ${p} -> ${exists ? '【存在】' : '不存在'}`);
      if (exists) {
        return p;
      }
    }

    return null;
  }

  /**
   * 收集可用的 node_modules 目錄，供 NODE_PATH 環境變數使用
   */
  getResolvedNodePath(cwd) {
    const searchDirs = [
      path.join(cwd, 'node_modules'),
      path.join(process.resourcesPath || '', 'standalone', 'node_modules'),
      path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules'),
      path.join(process.resourcesPath || '', 'node_modules'),
      path.join(__dirname, '..', 'node_modules'),
      path.join(__dirname, '..', '.next', 'standalone', 'node_modules')
    ];

    const validDirs = searchDirs.filter((d) => fs.existsSync(d));
    this.logInfo('解析可用 node_modules 模組路徑 (NODE_PATH)', { validDirs });
    return validDirs.join(path.delimiter);
  }

  /**
   * 動態尋找 127.0.0.1 上的未占用安全連接埠 (3100 ~ 3999)
   */
  async findFreePort(startPort = 3100) {
    return new Promise((resolve, reject) => {
      let currentPort = startPort;
      const maxPort = 3999;

      const testPort = (p) => {
        if (p > maxPort) {
          return reject(new Error(`在範圍 ${startPort} ~ ${maxPort} 內未找到可用的本機連接埠`));
        }

        const server = net.createServer();
        server.unref();

        server.on('error', () => {
          testPort(p + 1);
        });

        server.listen({ host: '127.0.0.1', port: p }, () => {
          server.close(() => {
            resolve(p);
          });
        });
      };

      testPort(currentPort);
    });
  }

  /**
   * 啟動 Next.js 伺服器子進程
   */
  async start() {
    this.onStatusUpdate('正在初始化本機資料庫與資源...');
    this.ensureDatabase();

    const serverScriptPath = this.findServerScript();
    if (!serverScriptPath) {
      const msg = '找不到 Next.js Standalone server.js 伺服器入口檔案！';
      this.logError(msg, { resourcesPath: process.resourcesPath });
      throw new Error(msg);
    }

    this.onStatusUpdate('正在尋找未被占用的本機連接埠...');
    this.port = await this.findFreePort(3100);
    this.logInfo(`已選定本機回環連接埠: 127.0.0.1:${this.port}`);

    this.hasExitedEarly = false;
    this.exitCode = null;
    this.exitSignal = null;
    this.lastError = null;
    this.recentStderrLines = [];
    this.recentStdoutLines = [];

    const cwd = path.dirname(serverScriptPath);
    const execPath = process.execPath;
    const nodePath = this.getResolvedNodePath(cwd);
    const databaseUrl = this.getDatabaseUrl();

    // 檢查 node_modules 是否在 cwd 中存在
    const cwdNodeModules = path.join(cwd, 'node_modules');
    const hasLocalNodeModules = fs.existsSync(cwdNodeModules);
    this.logInfo('檢查 Standalone 目錄下之依賴套件結構', {
      cwdNodeModules,
      exists: hasLocalNodeModules
    });

    const serverLogStream = fs.createWriteStream(this.serverLogPath, { flags: 'a' });
    serverLogStream.write(`\n=== [${new Date().toISOString()}] Next.js Standalone 伺服器啟動 (127.0.0.1:${this.port}) ===\n`);

    const env = {
      ...process.env,
      PORT: String(this.port),
      HOSTNAME: '127.0.0.1',
      DATABASE_URL: databaseUrl,
      NODE_ENV: 'production',
      ELECTRON_RUN_AS_NODE: '1',
      ELECTRON_NO_ASAR: '1',
      NODE_PATH: nodePath,
    };

    this.logInfo('正在啟動伺服器子進程...', {
      execPath,
      serverScriptPath,
      cwd,
      port: this.port,
      databaseUrlPrefix: databaseUrl.substring(0, 15) + '...'
    });

    this.onStatusUpdate(`正在啟動本機伺服器服務 (連接埠: ${this.port})...`);

    try {
      this.serverProcess = spawn(execPath, [serverScriptPath], {
        env,
        cwd,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      this.logInfo(`伺服器子進程已成功建立 (PID: ${this.serverProcess.pid})`);

      this.serverProcess.stdout.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        serverLogStream.write(text);
        const lines = text.split('\n').filter(Boolean);
        for (const l of lines) {
          this.recentStdoutLines.push(l.trim());
          if (this.recentStdoutLines.length > 50) this.recentStdoutLines.shift();
        }
      });

      this.serverProcess.stderr.on('data', (chunk) => {
        const text = chunk.toString('utf8');
        serverLogStream.write(`[STDERR] ${text}`);
        const lines = text.split('\n').filter(Boolean);
        for (const l of lines) {
          this.recentStderrLines.push(l.trim());
          if (this.recentStderrLines.length > 50) this.recentStderrLines.shift();
        }
      });

      this.serverProcess.on('error', (err) => {
        this.lastError = err;
        this.logError('伺服器程序發生異常 (error 事件)', { error: err.message });
      });

      this.serverProcess.on('exit', (code, signal) => {
        this.hasExitedEarly = true;
        this.exitCode = code;
        this.exitSignal = signal;
        this.logWarn(`伺服器子進程已結束退出 (代碼: ${code}, 信號: ${signal})`, {
          recentStderr: this.recentStderrLines.slice(-8)
        });
      });

      return this.port;
    } catch (spawnErr) {
      this.logError('子程序 spawn 失敗', { error: spawnErr.message });
      throw spawnErr;
    }
  }

  /**
   * 智慧輪詢健康檢查端點，具備快速失敗機制 (Fast-fail)
   */
  async waitForReady(timeoutMs = 35000) {
    const startTime = Date.now();
    const url = `http://127.0.0.1:${this.port}/api/health`;
    this.logInfo(`開始執行伺服器健康檢查輪詢: ${url} (逾時限制: ${timeoutMs}ms)`);

    let attempts = 0;

    while (Date.now() - startTime < timeoutMs) {
      attempts++;

      // 快速失敗檢查：若子進程已經異常退出，立即中斷等待！
      if (this.hasExitedEarly) {
        const errDetail = this.recentStderrLines.slice(-10).join(' | ') || '伺服器程序於啟動時非預期終止 (無 stderr 輸出)';
        const failMsg = `伺服器子進程提前退出 (結束代碼: ${this.exitCode})，錯誤資訊: ${errDetail}`;
        this.logError(failMsg);
        throw new Error(failMsg);
      }

      this.onStatusUpdate(`正在進行本機服務健康檢查 (第 ${attempts} 次嘗試)...`);

      try {
        const result = await new Promise((resolve) => {
          const req = http.get(url, { timeout: 1500 }, (res) => {
            let body = '';
            res.on('data', (d) => { body += d; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                resolve({ ok: true, status: res.statusCode, body });
              } else {
                resolve({ ok: false, status: res.statusCode, body: body.slice(0, 100) });
              }
            });
          });

          req.on('error', (e) => {
            resolve({ ok: false, error: e.message });
          });

          req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, timeout: true });
          });
        });

        if (result.ok) {
          const elapsed = Date.now() - startTime;
          this.logInfo(`伺服器健康檢查成功！耗時: ${elapsed}ms (嘗試次數: ${attempts})`, {
            responseBody: result.body
          });
          this.onStatusUpdate('本機服務連線就緒，正在載入畫面...');
          return true;
        } else if (result.status) {
          this.logWarn(`健康檢查回傳非 200 代碼 (HTTP ${result.status})`, { body: result.body });
        }
      } catch {
        // 輪詢間隙
      }

      await new Promise((r) => setTimeout(r, 450));
    }

    const recentStderr = this.recentStderrLines.slice(-8).join(' | ') || '無 stderr 輸出';
    const timeoutMsg = `伺服器在 ${timeoutMs / 1000} 秒內未能完成啟動回應 (嘗試 ${attempts} 次)。最後日誌: ${recentStderr}`;
    this.logError(timeoutMsg);
    throw new Error(timeoutMsg);
  }

  getLastDiagnostics() {
    return {
      port: this.port,
      hasExitedEarly: this.hasExitedEarly,
      exitCode: this.exitCode,
      recentStderr: this.recentStderrLines.slice(-5).join('; '),
      startupLogPath: this.startupLogPath,
      serverLogPath: this.serverLogPath
    };
  }

  stop() {
    if (!this.serverProcess) return;

    try {
      const pid = this.serverProcess.pid;
      this.logInfo(`正在安全終止 Next.js 伺服器子進程 (PID: ${pid})...`);

      if (process.platform === 'win32') {
        try {
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
        } catch {
          // 若程序已結束則忽略
        }
      } else {
        this.serverProcess.kill('SIGTERM');
      }
    } catch (err) {
      this.logWarn('終止伺服器子進程時發生警告:', { error: err.message });
    } finally {
      this.serverProcess = null;
    }
  }
}

module.exports = { NextServerManager };
