#!/usr/bin/env node
import { accessSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import spawn from "cross-spawn";
import tempDir from "temp-dir"; // /tmp
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const pidFile = `${tempDir}/debug-server-hmDAr917.pid`;
const port = 3000;

const failOnPidFileExists = () => {
  try {
    accessSync(pidFile);
  } catch (err) {
    return false;
  }
  console.error(
    `[error] Server appears to be running, found PID file ${pidFile}`,
  );
  return process.exit(116);
};

const writePidFile = (pid) => {
  try {
    writeFileSync(pidFile, pid.toString(10), { flag: "ax" });
  } catch (err) {
    console.error(`[error] Failed to write PID ${pid} PID file ${pidFile}: ${err.message}`);
    return process.exit(11);
  }
}

const unlinkPidFile = () => {
  try {
    unlinkSync(pidFile);
  } catch (err) {
    console.error(
      `[error] Failed to delete PID file ${pidFile}: ${err.message}`,
    );
    return process.exit(11);
  }
};

yargs(hideBin(process.argv))
  .command(
    "start",
    "Start the server",
    {},
    () => {
      failOnPidFileExists();

      const child = spawn(`${process.cwd()}/node_modules/.bin/vercel`, ["dev", "--listen", port], {
        detached: true,
        stdio: "pipe",
      });

      let isPidWritten = false;

      child.on("error", (err) => {
        console.log(err);
      });

      /** Forward child stdout to VS Code Task */
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (data) => {
        if (!isPidWritten) {
          writePidFile(child.pid);
          isPidWritten = true;
        }
        console.log(data);
      });

      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (error) => {
        console.error(error);
      });

      child.on("close", (code) => {
        child.unref();
        return process.exit(code);
      });
    },
  )
  .command(
    "stop",
    "Stop the server",
    {},
    () => {
      try {
        const pid = readFileSync(pidFile, { encoding: "utf8", flag: "r" });
        process.kill(parseInt(pid, 10), "SIGINT");
        unlinkPidFile();
        return process.exit(0);
      } catch (err) {
        console.error(
          `[error] Failed to shut down server, reading PID file ${pidFile}: ${err.message}`,
        );
        return process.exit(11);
      }
    },
  )
  .parse();
