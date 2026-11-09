// Starts / stops a throw-away local PostgreSQL cluster in ./.local-db (port 5544).
// Usage: node scripts/local-db.mjs start|stop
import { spawnSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const bin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
const dir = path.resolve(".local-db");
const exe = (n) => path.join(bin, n + (process.platform === "win32" ? ".exe" : ""));
const action = process.argv[2];

if (action === "start") {
  if (!existsSync(dir)) {
    spawnSync(exe("initdb"), ["-D", dir, "-U", "postgres", "--auth=trust", "-E", "UTF8"], { stdio: "inherit" });
  }
  spawn(exe("pg_ctl"), ["-D", dir, "-o", "-p 5544", "-l", path.join(dir, "server.log"), "start"], { stdio: "ignore", detached: true }).unref();
  setTimeout(() => {
    spawnSync(exe("createdb"), ["-h", "127.0.0.1", "-p", "5544", "-U", "postgres", "chique_bags"], { stdio: "ignore" });
    console.log("Local database ready on postgresql://postgres@127.0.0.1:5544/chique_bags");
  }, 4000);
} else if (action === "stop") {
  spawnSync(exe("pg_ctl"), ["-D", dir, "stop"], { stdio: "inherit" });
} else {
  console.log("Usage: node scripts/local-db.mjs start|stop");
}
