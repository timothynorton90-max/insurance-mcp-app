
import { timingSafeEqual } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import {
  createServer,
  getDashboardHtml
} from "./mcp-server.mjs";

// Local: 127.0.0.1:3001
// Render: 0.0.0.0 with Render-provided PORT
const isHosted = Boolean(process.env.PORT);
const port = Number(process.env.PORT || 3001);
const host = isHosted ? "0.0.0.0" : "127.0.0.1";

const app = createMcpExpressApp({ host });

// Require authentication when running in hosted mode
if (isHosted) {
  const expectedToken = process.env.MCP_API_KEY;

  if (!expectedToken || expectedToken.length < 32) {
    throw new Error("MCP_API_KEY is missing or too short");
  }

  app.use("/mcp", (req, res, next) => {
    const authorization = req.get("Authorization") || "";

    const suppliedToken = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const supplied = Buffer.from(suppliedToken);
    const expected = Buffer.from(expectedToken);

    const valid =
      supplied.length === expected.length &&
      timingSafeEqual(supplied, expected);

    if (!valid) {
      res.set("WWW-Authenticate", "Bearer");
      return res.status(401).send("Unauthorized");
    }

    next();
  });
}

// Browser preview: local only
app.get("/preview", async (req, res) => {
  if (isHosted) {
    return res.sendStatus(404);
  }

  try {
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    res.type("html").send(await getDashboardHtml());
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).send("Unable to load Salesforce data");
  }
});

// MCP endpoint
app.all("/mcp", async (req, res) => {
  const server = createServer();

  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

app.listen(port, host, () => {
  console.log(`Insurance MCP Server: http://${host}:${port}`);
  console.log(`MCP endpoint: /mcp`);
  console.log(`Mode: ${isHosted ? "Hosted (Protected)" : "Local"}`);
});
