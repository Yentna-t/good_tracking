const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const host = "127.0.0.1";
const port = 8000;
const backend = path.resolve(__dirname, "..", "..", "backend");
const python = process.platform === "win32" ? "python" : "python3";

function checkBackend(callback) {
  const socket = net.createConnection({ host, port });
  socket.once("connect", () => {
    socket.destroy();
    callback(true);
  });
  socket.once("error", () => {
    socket.destroy();
    callback(false);
  });
}

checkBackend((running) => {
  if (running) {
    console.log(`Backend is already running at http://${host}:${port}`);
    return;
  }

  const child = spawn(
    python,
    ["-m", "uvicorn", "app.main:app", "--reload", "--host", host, "--port", String(port)],
    {
      cwd: backend,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    },
  );

  child.once("error", (error) => {
    console.error(`Unable to start backend: ${error.message}`);
  });
  child.unref();
  console.log(`Starting backend at http://${host}:${port}`);
});
