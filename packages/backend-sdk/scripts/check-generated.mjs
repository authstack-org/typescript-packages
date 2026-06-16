import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");

for (const step of ["openapi:fetch", "generate:client"]) {
  const result = spawnSync("pnpm", ["run", step], {
    cwd: packageRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const diff = spawnSync(
  "git",
  ["diff", "--quiet", "--", "openapi/", "src/generated/"],
  { cwd: packageRoot },
);

if (diff.status !== 0) {
  console.error(
    "Generated SDK output is stale. Run `pnpm run generate` and commit the changes.",
  );
  spawnSync("git", ["diff", "--", "openapi/", "src/generated/"], {
    cwd: packageRoot,
    stdio: "inherit",
  });
  process.exit(1);
}

console.log("Generated SDK output is up to date");
