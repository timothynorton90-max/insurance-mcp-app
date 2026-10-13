
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import {
  createServer,
  getDashboardHtml
} from "./mcp-server.mjs";

const app = createMcpExpressApp({
  host: "127.0.0.1"
});

// Local browser preview with live Salesforce data
app.get("/preview", async (req, res) => {
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

app.listen(3001, "127.0.0.1", () => {
  console.log("MCP: http://localhost:3001/mcp");
  console.log("Live Dashboard: http://localhost:3001/preview");
});
