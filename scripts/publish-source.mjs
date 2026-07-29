import fs from "node:fs";
import git from "isomorphic-git";

const dir = process.cwd();
const remote = process.env.SITES_REMOTE_URL;
const token = process.env.SITES_SOURCE_TOKEN;
if (!remote || !token) throw new Error("Missing Sites source credentials");

await git.init({ fs, dir, defaultBranch: "main" });
try {
  await git.addRemote({ fs, dir, remote: "sites", url: remote, force: true });
} catch {
  await git.setConfig({ fs, dir, path: "remote.sites.url", value: remote });
}
await git.add({ fs, dir, filepath: "." });
const sha = await git.commit({
  fs,
  dir,
  author: { name: "Codex", email: "codex@openai.com" },
  message: "Build SafeChange PSM MOC Assistant MVP",
});
await git.push({
  fs,
  dir,
  remote: "sites",
  ref: "main",
  force: true,
  onAuth: () => ({ username: "oauth2", password: token }),
});
console.log(sha);
