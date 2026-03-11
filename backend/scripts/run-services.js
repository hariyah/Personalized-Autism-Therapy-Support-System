const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..", "..");
const isWindows = process.platform === "win32";

const pythonPath = isWindows
  ? path.join(projectRoot, "backend", "services", "therapy-collab-ai", ".venv", "Scripts", "python.exe")
  : path.join(projectRoot, "backend", "services", "therapy-collab-ai", ".venv", "bin", "python");

const services = [
  {
    name: "therapy-collab-ai",
    command: pythonPath,
    args: ["-m", "uvicorn", "main:app", "--port", "8000"],
    cwd: path.join(projectRoot, "backend", "services", "therapy-collab-ai"),
  },
  {
    name: "therapy-collab",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(projectRoot, "backend", "services", "therapy-collab"),
  },
  {
    name: "gateway",
    command: "npm",
    args: ["run", "dev"],
    cwd: path.join(projectRoot, "backend", "gateway"),
  },
  {
    name: "frontend",
    command: "npm",
    args: ["start"],
    cwd: path.join(projectRoot, "frontend"),
  },
];

const children = [];

function startService(service) {
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: "inherit",
    shell: isWindows,
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${service.name} exited with code ${code}`);
    }
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

function main() {
  console.log("Starting frontend, gateway, therapy-collab API, and therapy-collab AI...");
  services.forEach(startService);
}

main();
