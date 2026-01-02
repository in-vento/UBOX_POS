const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const localtunnel = require('localtunnel');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

let mainWindow;
let serverProcess;
let tunnel;
const isDev = !app.isPackaged;

const userDataPath = app.getPath('userData');

function startNextServer() {
    return new Promise(async (resolve, reject) => {
        const resourcesPath = process.resourcesPath;
        const standalonePath = isDev
            ? path.join(__dirname, '..', '.next', 'standalone')
            : path.join(resourcesPath, 'standalone');

        const serverPath = path.join(standalonePath, 'server.js');
        const dbPath = path.join(userDataPath, 'dev.db');
        const bundledDbPath = path.join(standalonePath, 'dev.db');
        const vendorPath = path.join(standalonePath, 'vendor');

        // Database Initialization
        if (!isDev) {
            try {
                // Only copy the database if it doesn't exist to preserve user data
                if (!fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
                    console.log('Initializing database from bundle...');
                    fs.copyFileSync(bundledDbPath, dbPath);
                    console.log('Database initialized successfully.');
                }
            } catch (err) {
                console.error('Failed to initialize database:', err);
            }
        }

        // Run Database Schema Fix (via API)
        // We do this AFTER the server starts, but we define the logic here
        const runApiMigration = async () => {
            if (!isDev) {
                try {
                    log.info('Triggering database schema fix via API...');
                    // Wait a bit for server to be fully ready
                    await new Promise(r => setTimeout(r, 5000));

                    const response = await fetch('http://127.0.0.1:9009/api/migrate', {
                        method: 'POST'
                    });
                    const result = await response.json();
                    log.info('Migration API result:', result);
                } catch (err) {
                    log.error('Failed to trigger migration API:', err);
                }
            }
        };

        const env = {
            ...process.env,
            PORT: '9009',
            HOSTNAME: '0.0.0.0',
            NODE_ENV: 'production',
            DATABASE_URL: `file:${dbPath}`,
            ELECTRON_RUN_AS_NODE: '1',
            NODE_PATH: vendorPath
        };

        try {
            if (isDev) {
                const devServerPath = path.join(__dirname, '..', 'node_modules', '.bin', 'next');
                serverProcess = spawn('node', [devServerPath, 'dev', '-p', '9009'], {
                    cwd: path.join(__dirname, '..'),
                    env: { ...process.env },
                    shell: true
                });
            } else {
                serverProcess = spawn(process.execPath, [serverPath], {
                    cwd: standalonePath,
                    env: env,
                    shell: false
                });
            }

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Ready') || output.includes('Listening')) {
                    resolve();
                    // Trigger migration once server is ready
                    runApiMigration();
                }
            });

            serverProcess.on('error', (err) => {
                reject(err);
            });

        } catch (err) {
            reject(err);
        }

        setTimeout(resolve, 20000);
    });
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, '..', 'src', 'app', 'icon.png'),
    });

    mainWindow.loadURL(`data:text/html;charset=utf-8,
        <body style="background:#0f172a;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;overflow:hidden;">
            <div style="font-size:32px;font-weight:bold;margin-bottom:10px;">Ubox POS</div>
            <div style="font-size:16px;color:#94a3b8;margin-bottom:30px;">Iniciando sistema...</div>
            <div style="width:200px;height:4px;background:#1e293b;border-radius:2px;overflow:hidden;">
                <div style="width:50%;height:100%;background:#3b82f6;animation:load 2s infinite ease-in-out;"></div>
            </div>
            <style>@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}</style>
        </body>
    `);

    if (!isDev) {
        backupDatabase();
        try {
            await startNextServer();
        } catch (err) {
            console.error('Server failed to start:', err);
        }
    }

    const startURL = 'http://127.0.0.1:9009';

    const loadApp = () => {
        mainWindow.loadURL(startURL).catch(err => {
            setTimeout(loadApp, 2000);
        });
    };

    setTimeout(loadApp, isDev ? 0 : 3000);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => (mainWindow = null));

    if (!isDev) {
        // Auto Updater Logic
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = false;

        autoUpdater.on('checking-for-update', () => {
            log.info('Checking for update...');
        });

        autoUpdater.on('update-available', (info) => {
            log.info('Update available:', info.version);
            mainWindow.webContents.send('update-available');
        });

        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available.');
        });

        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded:', info.version);
            mainWindow.webContents.send('update-downloaded');
        });

        autoUpdater.on('error', (err) => {
            log.error('AutoUpdater error:', err);
        });

        // Check for updates with a delay to ensure renderer is ready
        setTimeout(() => {
            autoUpdater.checkForUpdates().catch(err => {
                log.error('Initial update check failed:', err);
            });
        }, 10000);

        // Check for updates every 2 hours
        setInterval(() => {
            autoUpdater.checkForUpdates().catch(err => {
                log.error('Periodic update check failed:', err);
            });
        }, 2 * 60 * 60 * 1000);
    }
}

function backupDatabase() {
    const dbPath = path.join(userDataPath, 'dev.db');
    const backupsDir = path.join(userDataPath, 'backups');

    if (fs.existsSync(dbPath)) {
        try {
            if (!fs.existsSync(backupsDir)) {
                fs.mkdirSync(backupsDir);
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupsDir, `dev.db.${timestamp}.bak`);

            fs.copyFileSync(dbPath, backupPath);
            console.log(`Database backup created at: ${backupPath}`);

            // Rotate backups (keep last 5)
            const files = fs.readdirSync(backupsDir)
                .filter(f => f.startsWith('dev.db.') && f.endsWith('.bak'))
                .sort(); // Sorts by name (timestamp), oldest first

            while (files.length > 5) {
                const fileToDelete = files.shift();
                if (fileToDelete) {
                    fs.unlinkSync(path.join(backupsDir, fileToDelete));
                    console.log(`Deleted old backup: ${fileToDelete}`);
                }
            }

        } catch (err) {
            console.error('Backup failed:', err);
        }
    }
}

ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

app.on('ready', createWindow);

app.on('window-all-closed', async () => {
    if (tunnel) await tunnel.close();
    if (serverProcess) serverProcess.kill();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('get-hwid', async () => {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
            exec('wmic csproduct get uuid', (error, stdout) => {
                if (error) {
                    resolve('UNKNOWN-HWID');
                } else {
                    const lines = stdout.split('\n');
                    const uuid = lines.length > 1 ? lines[1].trim() : 'UNKNOWN-HWID';
                    resolve(uuid);
                }
            });
        } else {
            resolve('NON-WINDOWS-HWID');
        }
    });
});

ipcMain.handle('start-tunnel', async (event, port) => {
    const targetPort = port || 9009;
    log.info(`Attempting to start tunnel on port ${targetPort}...`);

    try {
        if (tunnel) {
            log.info('Closing existing tunnel...');
            await tunnel.close();
        }

        // Verify local server is actually responding before starting tunnel
        try {
            const http = require('http');
            await new Promise((resolve, reject) => {
                const req = http.get(`http://127.0.0.1:${targetPort}`, (res) => {
                    resolve();
                });
                req.on('error', reject);
                req.end();
            });
            log.info(`Local server on port ${targetPort} is reachable.`);
        } catch (e) {
            log.warn(`Local server on port ${targetPort} is NOT reachable yet: ${e.message}`);
        }

        tunnel = await localtunnel({
            port: targetPort,
            local_host: '127.0.0.1',
            subdomain: `ubox-pos-${Math.random().toString(36).substring(2, 8)}`
        });

        log.info(`Tunnel established successfully at: ${tunnel.url}`);

        tunnel.on('close', () => {
            log.info('Tunnel connection closed');
            tunnel = null;
        });

        tunnel.on('error', (err) => {
            log.error('Tunnel error:', err);
        });

        return { url: tunnel.url };
    } catch (err) {
        log.error('Failed to establish tunnel:', err);
        return { error: err.message };
    }
});

ipcMain.handle('stop-tunnel', async () => {
    if (tunnel) {
        await tunnel.close();
        tunnel = null;
        return { success: true };
    }
    return { success: false, message: 'No active tunnel' };
});
