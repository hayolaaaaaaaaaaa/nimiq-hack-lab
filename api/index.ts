import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../server/index.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const protocol = process.env.VERCEL_URL ? "https" : "http";
  const host = req.headers.host || "localhost";
  const sourceUrl = new URL(req.url || "/", `${protocol}://${host}`);
  const path = sourceUrl.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readBody(req);
  const request = new Request(new URL(`${path}${sourceUrl.search}`, `${protocol}://${host}`), { method: req.method, headers, body: body || undefined, duplex: "half" } as RequestInit);
  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
