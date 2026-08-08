import * as esbuild from "esbuild";

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/dev/bundle.js",
  sourcemap: true,
  format: "iife",
  target: ["es2019"],
  logLevel: "info",
});

await ctx.watch();

const { host, port } = await ctx.serve({
  servedir: ".",
  port: 8000,
});

console.log(`Dev server running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
