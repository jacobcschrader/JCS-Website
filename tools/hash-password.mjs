// =====================================================================
//  ADMIN PASSWORD HASHER — run once when setting (or changing) the
//  admin password:
//
//      node tools/hash-password.mjs
//
//  Type your password at the prompt (it is not echoed or stored).
//  Copy the printed hash into Vercel → Settings → Environment
//  Variables → ADMIN_PASSWORD_HASH, then redeploy.
// =====================================================================
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout });

// hide typed characters
rl._writeToOutput = (s) => { if (s.includes("\n")) rl.output.write("\n"); };

process.stdout.write("Choose your admin password: ");
rl.question("", (password) => {
  rl.close();
  if (!password || password.length < 8) {
    console.error("\nPassword must be at least 8 characters. Nothing generated.");
    process.exit(1);
  }
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  console.log("\nADMIN_PASSWORD_HASH value (copy everything on the next line):\n");
  console.log(`${salt}:310000:${hash}`);
  console.log("\nAdd it in Vercel → Settings → Environment Variables, then redeploy.");
});
