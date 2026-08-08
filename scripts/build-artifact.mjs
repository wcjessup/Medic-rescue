import * as esbuild from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";

const result = await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  write: false,
});

const js = result.outputFiles[0].text;

// Safety scan: the artifact must be fully self-contained (no external network
// requests). Flag anything that looks like it reaches outside the page.
const suspiciousPatterns = [
  /https?:\/\//,
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /new\s+WebSocket/,
  /\bimport\s*\(/,
];
const hits = suspiciousPatterns.filter((re) => re.test(js));
if (hits.length > 0) {
  console.error("build:artifact FAILED safety scan — possible external reference(s) found:");
  for (const re of hits) console.error(`  matched pattern: ${re}`);
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<title>Paramedic Rescue</title>
<style>
  html, body { margin: 0; padding: 0; background: #000; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
  #app { width: 100vw; height: 100dvh; }
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;

await mkdir("dist/artifact", { recursive: true });
const outPath = "dist/artifact/paramedic-rescue.html";
await writeFile(outPath, html, "utf-8");

const bytes = Buffer.byteLength(html, "utf-8");
console.log(`Wrote ${outPath} (${(bytes / 1024).toFixed(1)} KB)`);
