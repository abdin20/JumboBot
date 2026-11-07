// Deploy JumboBot to the LXC container: pull from GitHub, install deps / re-register
// slash commands only when needed, then restart the pm2 process.
//
//   npm run deploy            deploy whatever is on origin/main
//   npm run deploy -- --force restart the bot even if there is nothing new
//
// Requires a "jumbo" host entry in your ~/.ssh/config pointing at the server, with key auth.
const { spawnSync } = require("child_process");

const SSH_HOST = "jumbo";
const REMOTE_DIR = "~/JumboBot";
const PM2_NAME = "JumboBot";
const force = process.argv.includes("--force");

const git = (args) =>
  spawnSync("git", args, { cwd: __dirname, encoding: "utf8" }).stdout.trim();

// The server pulls from GitHub, so anything not pushed won't be deployed.
spawnSync("git", ["fetch", "--quiet", "origin"], { cwd: __dirname });
const unpushed = git(["rev-list", "--count", "origin/main..HEAD"]);
if (unpushed && unpushed !== "0") {
  console.warn(`⚠ You have ${unpushed} local commit(s) not pushed to origin/main — they won't be deployed.\n`);
}

const remoteScript = `
set -euo pipefail
source ~/.nvm/nvm.sh
cd ${REMOTE_DIR}

OLD=$(git rev-parse HEAD)
echo "→ Pulling from GitHub..."
if ! GIT_TERMINAL_PROMPT=0 git pull --ff-only; then
  echo "✗ git pull failed. If it mentions local changes to bogHistory.json/bogState.json,"
  echo "  a commit touched those runtime files — resolve it on the server by hand."
  exit 1
fi
NEW=$(git rev-parse HEAD)

if [ "$OLD" = "$NEW" ] && [ "${force ? "1" : "0"}" != "1" ]; then
  echo "✓ Already up to date at $(git log --oneline -1). Nothing to restart (use --force to restart anyway)."
  exit 0
fi

if [ "$OLD" != "$NEW" ]; then
  echo "→ New commits:"
  git log --oneline "$OLD..$NEW"
  CHANGED=$(git diff --name-only "$OLD" "$NEW")

  if echo "$CHANGED" | grep -qE '^package(-lock)?\\.json$'; then
    echo "→ Dependencies changed, running npm install..."
    npm install --no-audit --no-fund
  fi

  if echo "$CHANGED" | grep -qE '^(commands/|deploy-commands\\.js$)'; then
    echo "→ Slash commands changed, re-registering with Discord..."
    node deploy-commands.js
  fi
fi

echo "→ Restarting ${PM2_NAME}..."
pm2 restart ${PM2_NAME} --update-env >/dev/null
sleep 5
STATUS=$(pm2 jlist | node -e 'const p=JSON.parse(require("fs").readFileSync(0)).find(p=>p.name==="${PM2_NAME}");console.log(p?p.pm2_env.status+" restarts="+p.pm2_env.restart_time:"missing")')
echo "→ ${PM2_NAME}: $STATUS"
echo "→ Recent logs:"
pm2 logs ${PM2_NAME} --lines 15 --nostream --raw 2>&1 | tail -n 15
case "$STATUS" in online*) echo "✓ Deployed $(git log --oneline -1)";; *) echo "✗ Bot is not online"; exit 1;; esac
`;

const result = spawnSync("ssh", ["-o", "BatchMode=yes", SSH_HOST, "bash -s"], {
  input: remoteScript,
  stdio: ["pipe", "inherit", "inherit"],
});
if (result.error) {
  console.error("Could not run ssh:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
