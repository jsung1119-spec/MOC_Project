import { mkdir, writeFile } from "node:fs/promises";
import WebSocket from "ws";

const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222";
const output = new URL("../screenshots/", import.meta.url);
await mkdir(output, { recursive: true });

async function target(url) {
  const response = await fetch(`${endpoint}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  return response.json();
}

async function connect(targetInfo) {
  const ws = new WebSocket(targetInfo.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const eventListeners = [];
  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      data.error ? reject(new Error(data.error.message)) : resolve(data.result);
    }
    eventListeners.forEach(listener => listener(data));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, { resolve, reject });
    ws.send(JSON.stringify({ id: callId, method, params }));
  });
  const nextEvent = (method) => new Promise(resolve => {
    const listener = (data) => {
      if (data.method === method) {
        eventListeners.splice(eventListeners.indexOf(listener), 1);
        resolve(data.params);
      }
    };
    eventListeners.push(listener);
  });
  return { ws, send, nextEvent };
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const tab = await target("http://localhost:3000/");
console.log("target", tab.id);
const { ws, send, nextEvent } = await connect(tab);
console.log("connected");
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 980, deviceScaleFactor: 1, mobile: false });
await wait(1800);
console.log("ready");
if (process.env.SEED_ONLY === "1") {
  await send("Runtime.evaluate", { expression: `localStorage.setItem("safechange-session","operator01")` });
  await send("Browser.close").catch(() => {});
  process.exit(0);
}

async function screencast(name) {
  const frame = nextEvent("Page.screencastFrame");
  await send("Page.startScreencast", { format: "png", quality: 100, maxWidth: 1440, maxHeight: 980, everyNthFrame: 1 });
  const params = await frame;
  await send("Page.screencastFrameAck", { sessionId: params.sessionId });
  await send("Page.stopScreencast");
  await writeFile(new URL(name, output), Buffer.from(params.data, "base64"));
}
await screencast("01-login.png");
console.log("login");

await send("Runtime.evaluate", { expression: `localStorage.setItem("safechange-session","operator01"); location.reload();` });
await wait(2200);
await screencast("02-dashboard.png");
console.log("dashboard");

await send("Runtime.evaluate", { expression: `Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("상세"))?.click()` });
await wait(900);
await screencast("03-progress.png");
console.log("progress");
ws.close();
process.exit(0);
