
import { readFile } from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/server";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { getInsuranceDemoData } from "./salesforce-data.mjs";

const resourceUri = "ui://insurance/dashboard.html";

export async function getDashboardHtml() {
  const data = await getInsuranceDemoData();

  let html = await readFile(
    new URL("./dist/mcp-app.html", import.meta.url),
    "utf8"
  );

  const safeData = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  const bootstrap = `
    <script>
      window.__INSURANCE_DEMO_DATA__ = ${safeData};
    </script>
  `;

  if (!html.includes("</head>")) {
    throw new Error("HTML head not found");
  }

  return html.replace("</head>", `${bootstrap}</head>`);
}

export function createServer() {
  const server = new McpServer({
    name: "Insurance 360 MCP App",
    version: "1.0.0"
  });

  registerAppTool(
    server,
    "show_insurance_dashboard",
    {
      title: "Show Insurance 360 Dashboard",
      description:
        "Retrieve live Salesforce insurance Accounts and Policies.",
      inputSchema: z.object({
        accountName: z.string().optional()
      }),
      _meta: {
        ui: { resourceUri }
      }
    },
    async ({ accountName }) => {
      const data = await getInsuranceDemoData();

      const account = data.accounts.find(
        a => a.name.toLowerCase() ===
          (accountName || "PulseLab Fitness").toLowerCase()
      );

      const policies = account
        ? data.policies.filter(p => p.accountId === account.id)
        : [];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            account: account || null,
            policies,
            totalPremium: policies.reduce(
              (sum, p) => sum + (Number(p.premium) || 0), 0
            ),
            source: "Salesforce PexInsDev"
          })
        }]
      };
    }
  );

  registerAppResource(
    server,
    "Insurance Dashboard UI",
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [{
        uri: resourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: await getDashboardHtml()
      }]
    })
  );

  return server;
}
