import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const authstackRoot =
  process.env.AUTHSTACK_ROOT ?? path.resolve(packageRoot, "../../../authstack");
const outputPath = path.join(packageRoot, "openapi", "authstack.openapi.json");

const result = spawnSync("cargo", ["run", "--quiet", "--", "openapi"], {
  cwd: authstackRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Failed to generate OpenAPI spec from authstack");
  process.exit(result.status ?? 1);
}

const spec = JSON.parse(result.stdout);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");

console.log(`Wrote OpenAPI spec to ${outputPath}`);
