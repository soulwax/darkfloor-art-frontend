const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  dialog,
} = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

const isDev = process.env.NODE_ENV === "development";
const prodPort = 3222;

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;

/**
 * @param {...any} args
 */
const log = (...args) => {
  console.log("[Electron]", ...args);
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
      const port = typeof address === 'object' && address !== null ? address.port : startPort;
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

  // Determine paths
  const basePath = app.isPackaged
    ? path.join(process.resourcesPath, ".next")
    : path.join(__dirname, "..", ".next");

  const serverPath = path.join(basePath, "standalone", "server.js");
  const staticPath = path.join(basePath, "static");
  const publicPath = app.isPackaged
    ? path.join(process.resourcesPath, "public")
    : path.join(__dirname, "..", "public");

  log("Paths:");
  log("  Base:", basePath);
  log("  Server:", serverPath);
  log("  Static:", staticPath);
  log("  Public:", publicPath);
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
    const serverDir = path.dirname(serverPath);

    serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        HOSTNAME: "localhost",
        NODE_ENV: "production",
      },
      cwd: serverDir,
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
      dialog.showErrorBox(
        "Server Start Failed",
        `Failed to start the application server:\n\n${err.message}\n\nCheck the console for details.`,
      );
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
    },
    icon: path.join(__dirname, "../public/icon.png"),
    backgroundColor: "#000000",
    show: false,
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
    if (!isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  log(`Loading URL: ${serverUrl}`);
  mainWindow.loadFile(path.join(__dirname, "../out/index.html"));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

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
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  log("All windows closed");
  if (serverProcess) {
    log("Killing server process");
    serverProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  log("App will quit");
  globalShortcut.unregisterAll();
  if (serverProcess) {
    serverProcess.kill();
  }
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
