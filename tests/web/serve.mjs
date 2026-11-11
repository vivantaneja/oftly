import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
const config = JSON.parse(await readFile("vercel.json", "utf8")),
  root = resolve("dist-web");
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
};
createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + "/")) throw Error();
    const target = (await stat(path)).isDirectory()
      ? path + "/index.html"
      : path;
    for (const header of config.headers[0].headers)
      res.setHeader(header.key, header.value);
    res.setHeader(
      "Content-Type",
      mime[extname(target)] ?? "application/octet-stream",
    );
    res.end(await readFile(target));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(18766, "127.0.0.1");
