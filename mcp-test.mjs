
import {
  Client,
  StreamableHTTPClientTransport
} from "@modelcontextprotocol/client";

const client = new Client({
  name: "insurance-test",
  version: "1.0.0"
});

try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL("http://127.0.0.1:3001/mcp")
    )
  );

  const { tools } = await client.listTools();
  console.log("Available tools:", tools.map(t => t.name));

  const result = await client.callTool({
    name: "show_insurance_dashboard",
    arguments: { accountName: "PulseLab Fitness" }
  });

  console.log("Tool response:", JSON.stringify(result));
  
const ui = await client.readResource({
  uri: "ui://insurance/dashboard.html"
});


const html = ui.contents[0].text;

console.log("React HTML size:", html.length);
console.log("React bundle included:", html.includes("PulseLab Fitness"));


} catch (error) {
  console.error("MCP test failed:", error);
} finally {
  await client.close();
}
