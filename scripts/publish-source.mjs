import fs from "node:fs";
import git from "isomorphic-git";

const http = {
  async request({ url, method = "GET", headers = {}, body }) {
    let payload;
    if (body) {
      const chunks = [];
      for await (const chunk of body) chunks.push(Buffer.from(chunk));
      payload = Buffer.concat(chunks);
    }
    const response = await fetch(url, { method, headers, body: payload, redirect: "follow" });
    return {
      url: response.url,
      method,
      statusCode: response.status,
      statusMessage: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.body,
    };
  },
};

const dir = process.cwd();
const gitdir = `${dir}/.sites-git`;
const remote = process.env.SITES_REMOTE_URL;
const token = process.env.SITES_SOURCE_TOKEN;
if (!remote || !token) throw new Error("Missing Sites source credentials");

await git.init({ fs, dir, gitdir, defaultBranch: "main" });
try {
  await git.addRemote({ fs, dir, gitdir, remote: "sites", url: remote, force: true });
} catch {
  await git.setConfig({ fs, dir, gitdir, path: "remote.sites.url", value: remote });
}
await git.add({ fs, dir, gitdir, filepath: "." });
const sha = await git.commit({
  fs,
  dir,
  gitdir,
  author: { name: "Codex", email: "codex@openai.com" },
  message: "Build SafeChange PSM MOC Assistant MVP",
});
await git.push({
  fs,
  http,
  dir,
  gitdir,
  remote: "sites",
  ref: "main",
  force: true,
  onAuth: () => ({ username: "oauth2", password: token }),
});
console.log(sha);
