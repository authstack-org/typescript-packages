import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const outputPath = path.join(packageRoot, "openapi", "authstack.openapi.json");

const candidateRoots = [
  process.env.AUTHSTACK_ROOT,
  path.resolve(packageRoot, "../../../authstack"),
  path.resolve(packageRoot, "../../authstack"),
].filter((value, index, array) => value && array.indexOf(value) === index);

async function resolveAuthstackRoot() {
  for (const candidate of candidateRoots) {
    try {
      await access(path.join(candidate, "Cargo.toml"));
      return candidate;
    } catch {
      continue;
    }
  }

  console.error("Could not find authstack backend checkout.");
  console.error("Set AUTHSTACK_ROOT to the backend repo root, or place authstack at one of:");
  for (const candidate of candidateRoots) {
    console.error(`  - ${candidate}`);
  }
  process.exit(1);
}

const authstackRoot = await resolveAuthstackRoot();
console.log(`Using authstack backend at ${authstackRoot}`);

const result = spawnSync("cargo", ["run", "--quiet", "--", "openapi"], {
  cwd: authstackRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  console.error(`cargo run -- openapi failed in ${authstackRoot}`);
  if (result.stderr) {
    console.error(result.stderr);
  }
  if (result.stdout) {
    console.error(result.stdout);
  }
  process.exit(result.status ?? 1);
}

let spec;
try {
  spec = JSON.parse(result.stdout);
} catch (error) {
  console.error("cargo run -- openapi did not return valid JSON");
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`Wrote OpenAPI spec to ${outputPath}`);
