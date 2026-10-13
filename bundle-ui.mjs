
import { readFile, writeFile } from "node:fs/promises";

const dist = new URL("./dist/", import.meta.url);

// Read the React production HTML
let html = await readFile(
  new URL("index.html", dist),
  "utf8"
);

// Find the generated JavaScript and CSS files
const jsMatch = html.match(
  /<script\b[^>]*src="\/(assets\/[^"]+\.js)"[^>]*><\/script>/i
);

const cssMatch = html.match(
  /<link\b[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/i
);

if (!jsMatch || !cssMatch) {
  throw new Error(
    "React build assets not found. Run npm.cmd run build first."
  );
}

// Read the JavaScript bundle
const js = await readFile(
  new URL(jsMatch[1], dist),
  "utf8"
);

// Read the stylesheet
const css = await readFile(
  new URL(cssMatch[1], dist),
  "utf8"
);

// Prevent HTML from closing the inline script early
const safeJs = js.replace(/<\/script/gi, "<\\/script");

// Prevent HTML from closing the inline style early
const safeCss = css.replace(/<\/style/gi, "<\\/style");

// Embed JavaScript without special $ replacement expansion
html = html.replace(
  jsMatch[0],
  () => `<script type="module">\n${safeJs}\n</script>`
);

// Embed CSS without special $ replacement expansion
html = html.replace(
  cssMatch[0],
  () => `<style>\n${safeCss}\n</style>`
);

// Save a self-contained MCP App HTML file
await writeFile(
  new URL("mcp-app.html", dist),
  html,
  "utf8"
);

console.log("MCP React UI bundle created successfully!");
console.log("Bundled JavaScript:", js.length, "characters");
console.log("Bundled CSS:", css.length, "characters");
