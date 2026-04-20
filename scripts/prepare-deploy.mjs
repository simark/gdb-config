import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const buildDir = path.join(rootDir, "build");
const sourceHtmlPath = path.join(rootDir, "index.html");
const browserBundlePath = path.join(rootDir, "index.js");

const sourceHtml = readFileSync(sourceHtmlPath, "utf8");
const browserBundle = readFileSync(browserBundlePath);
const browserBundleHash = createHash("sha256")
  .update(browserBundle)
  .digest("hex")
  .slice(0, 12);
const fingerprintedBundleName = `index.${browserBundleHash}.js`;
const deployHtml = sourceHtml.replace(
  '<script src="./index.js"></script>',
  `<script src="./${fingerprintedBundleName}"></script>`,
);

if (deployHtml === sourceHtml) {
  throw new Error("Could not find browser bundle script tag in index.html.");
}

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
writeFileSync(path.join(buildDir, "index.html"), deployHtml);
writeFileSync(path.join(buildDir, fingerprintedBundleName), browserBundle);
