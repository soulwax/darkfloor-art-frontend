// File: electron/main.js

// Load environment variables from .env.local first
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  dialog,
  session,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

// Production detection: packaged apps or explicit ELECTRON_PROD flag
const isDev = !app.isPackaged && process.env.ELECTRON_PROD !== "true";
const prodPort = 3222;

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;

// Window state storage
const windowStateFile = path.join(app.getPath("userData"), "window-state.json");

/**
 * @param {...any} args
 */
const log = (...args) => {
  console.log("[Electron]", ...args);
};

/**
 * Load saved window state
 * @returns {{width: number, height: number, x?: number, y?: number, isMaximized: boolean}}
 */
const loadWindowState = () => {
  try {
    if (fs.existsSync(windowStateFile)) {
      const data = fs.readFileSync(windowStateFile, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    log("Failed to load window state:", err);
  }

  // Default window state
  return {
    width: 1200,
    height: 800,
    isMaximized: false,
  };
};

/**
 * Save current window state
 * @param {BrowserWindow} window
 */
const saveWindowState = (window) => {
  try {
    const bounds = window.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized(),
    };
    fs.writeFileSync(windowStateFile, JSON.stringify(state, null, 2));
    log("Window state saved");
  } catch (err) {
    log("Failed to save window state:", err);
  }
};

/**
 * @param {number} startPort
 * @returns {Promise<number>}
 */
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(startPort, () => {
      const address = server.address();
      const port =
        typeof address === "object" && address !== null
          ? address.port
          : startPort;
      server.close(() => {
        log(`Found available port: ${port}`);
        resolve(port);
      });
    });
    server.on("error", () => {
      log(`Port ${startPort} in use, trying ${startPort + 1}`);
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

/**
 * @param {number} port
 * @param {number} maxAttempts
 * @returns {Promise<boolean>}
 */
const waitForServer = (port, maxAttempts = 30) => {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkServer = () => {
      log(
        `Checking server on port ${port} (attempt ${attempts + 1}/${maxAttempts})`,
      );
      http
        .get(`http://localhost:${port}`, (res) => {
          log(`Server responded with status: ${res.statusCode}`);
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve(true);
          } else {
            retry();
          }
        })
        .on("error", (err) => {
          log(`Server check error: ${err.message}`);
          retry();
        });
    };

    const retry = () => {
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 1000);
      } else {
        log("Server failed to start after max attempts");
        resolve(false);
      }
    };

    checkServer();
  });
};

const startServer = async () => {
  const port = await findAvailablePort(prodPort);

  // Determine paths - standalone directory contains everything
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  const serverPath = path.join(standaloneDir, "server.js");

  log("Paths:");
  log("  Standalone dir:", standaloneDir);
  log("  Server:", serverPath);
  log("  isPackaged:", app.isPackaged);

  // Check if server.js exists
  if (!fs.existsSync(serverPath)) {
    const error = `Server file not found: ${serverPath}`;
    log("ERROR:", error);
    dialog.showErrorBox("Server Error", error);
    throw new Error(error);
  }

  log("Server file exists, starting...");

  return new Promise((resolve, reject) => {
    // Run server from standalone directory (it contains .next/static and public)
    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: "localhost",
        NODE_ENV: "production",
      },
      cwd: standaloneDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess.stdout?.on("data", (data) => {
      log("[Server STDOUT]:", data.toString().trim());
    });

    serverProcess.stderr?.on("data", (data) => {
      log("[Server STDERR]:", data.toString().trim());
    });

    serverProcess.on("error", (err) => {
      log("[Server ERROR]:", err);
      reject(err);
    });

    serverProcess.on("exit", (code, signal) => {
      log(`[Server EXIT] Code: ${code}, Signal: ${signal}`);
    });

    // Wait for server to be ready
    waitForServer(port).then((ready) => {
      if (ready) {
        log(`Server started successfully on port ${port}`);
        resolve(port);
      } else {
        const error = "Server failed to respond after 30 seconds";
        log("ERROR:", error);
        reject(new Error(error));
      }
    });
  });
};

const createWindow = async () => {
  log("Creating window...");
  log(`Mode: ${isDev ? "Development" : "Production"}`);
  log(`Packaged: ${app.isPackaged}`);
  log(`ELECTRON_PROD: ${process.env.ELECTRON_PROD}`);
  let serverUrl;

  if (isDev) {
    log("Development mode - connecting to dev server");
    serverUrl = `http://localhost:${prodPort}`;
  } else {
    log("Production mode - starting bundled server");
    try {
      const port = await startServer();
      serverUrl = `http://localhost:${port}`;
      log(`Will load URL: ${serverUrl}`);
    } catch (err) {
      log("FATAL ERROR starting server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      dialog.showErrorBox(
        "Server Start Failed",
        `Failed to start the application server:\n\n${errorMessage}\n\nCheck the console for details.`,
      );
      app.quit();
      return;
    }
  }

  // Load saved window state
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
      // Enable persistent storage partition
      partition: "persist:starchild-music",
    },
    icon: path.join(__dirname, "../public/icon.png"),
    backgroundColor: "#000000",
    show: false,
  });

  // Restore maximized state
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Save window state on resize and move
  mainWindow.on("resize", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("move", () => {
    if (mainWindow && !mainWindow.isMaximized()) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("maximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("unmaximize", () => {
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.webContents.on("did-start-loading", () => {
    log("Page started loading");
  });

  mainWindow.webContents.on("did-finish-load", () => {
    log("Page finished loading");
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      log("Page failed to load:", errorCode, errorDescription);
    },
  );

  mainWindow.once("ready-to-show", () => {
    log("Window ready to show");
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  log(`Loading URL: ${serverUrl}`);
  mainWindow.loadURL(serverUrl);

  mainWindow.on("close", () => {
    // Save window state before closing
    if (mainWindow) {
      saveWindowState(mainWindow);
    }
  });

  mainWindow.on("closed", () => {
    log("Window closed");
    mainWindow = null;
  });

  registerMediaKeys();
};

const registerMediaKeys = () => {
  try {
    globalShortcut.register("MediaPlayPause", () => {
      mainWindow?.webContents.send("media-key", "play-pause");
    });

    globalShortcut.register("MediaNextTrack", () => {
      mainWindow?.webContents.send("media-key", "next");
    });

    globalShortcut.register("MediaPreviousTrack", () => {
      mainWindow?.webContents.send("media-key", "previous");
    });
    log("Media keys registered");
  } catch (err) {
    log("Failed to register media keys:", err);
  }
};

app.whenReady().then(() => {
  log("App ready");

  // Configure session persistence
  const ses = session.defaultSession;

  // Set persistent storage path for cookies and cache
  const userDataPath = app.getPath("userData");
  log("User data path:", userDataPath);

  // Log storage path
  log("Storage path:", ses.getStoragePath());

  // Set cookie persistence - cookies won't expire on app restart
  ses.cookies.on("changed", (_event, cookie, cause, removed) => {
    if (!removed && isDev) {
      log(`Cookie set: ${cookie.name} (${cause})`);
    }
  });

  // Flush cookie store to ensure persistence
  ses.cookies.flushStore().then(() => {
    log("Session configured with persistent storage");
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Gracefully shutdown the server process
 * @returns {Promise<void>}
 */
const shutdownServer = () => {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }

    log("Shutting down server gracefully...");

    // Try graceful shutdown first (SIGTERM)
    serverProcess.kill("SIGTERM");

    // Force kill after 5 seconds if not stopped
    const killTimeout = setTimeout(() => {
      if (serverProcess) {
        log("Force killing server process");
        serverProcess.kill("SIGKILL");
      }
    }, 5000);

    serverProcess.on("exit", () => {
      clearTimeout(killTimeout);
      log("Server process terminated");
      serverProcess = null;
      resolve();
    });
  });
};

app.on("window-all-closed", async () => {
  log("All windows closed");
  await shutdownServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", async (event) => {
  log("App will quit");
  event.preventDefault();

  globalShortcut.unregisterAll();

  // Flush cookies before quitting to ensure they're saved
  try {
    await session.defaultSession.cookies.flushStore();
    log("Cookies flushed to disk");
  } catch (err) {
    log("Error flushing cookies:", err);
  }

  await shutdownServer();

  app.exit(0);
});

if (!isDev) {
  Menu.setApplicationMenu(null);
}

process.on("uncaughtException", (err) => {
  log("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  log("Unhandled rejection:", err);
});
