
import { useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

const liveData =
  typeof window !== "undefined"
    ? window.__INSURANCE_DEMO_DATA__
    : null;

const accounts = liveData?.accounts || [];
const allPolicies = liveData?.policies || [];

const money = value =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = value =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "Not available";

const policyLabels = {
  "HRP-PL-GL-001": "General Liability",
  "HRP-PL-CYBER-001": "Cyber Insurance",
  "HRP-PL-EPLI-001": "Employment Practices Liability",
  "HRP-PL-PROP-001": "Commercial Property",
  "HRP-PL-UMB-001": "Commercial Umbrella"
};

function McpConnection() {
  const { isConnected } = useApp({
    appInfo: {
      name: "Insurance 360 Dashboard",
      version: "1.0.0"
    },
    capabilities: {}
  });

  return (
    <small>
      {isConnected ? "MCP App connected" : "Connecting to MCP host"}
    </small>
  );
}

export default function App() {
  const [selected, setSelected] = useState(
    accounts.find(a => a.name === "PulseLab Fitness")?.id ||
    accounts[0]?.id ||
    ""
  );

  const account = accounts.find(a => a.id === selected);

  const policies = allPolicies.filter(
    p => p.accountId === selected
  );

  const totalPremium = policies.reduce(
    (sum, p) => sum + (Number(p.premium) || 0), 0
  );

  const card = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 24,
    marginTop: 20
  };

  return (
    <main style={{
      fontFamily: "Arial, sans-serif",
      background: "#f2f5fa",
      color: "#17243b",
      minHeight: "100vh",
      width: "100%",
      boxSizing: "border-box",
      padding: 28,
      textAlign: "left"
    }}>
      <div style={{ maxWidth: 1050, margin: "auto" }}>
        <h1>Insurance 360 Dashboard</h1>
        <p>Harlow Risk Partners | Salesforce Insurance Demo</p>

        <div style={{
          background: "#e6f6ee",
          color: "#176443",
          padding: 12,
          borderRadius: 8
        }}>
          {liveData
            ? "Live Salesforce Data | PexInsDev"
            : "Live data unavailable | Open localhost:3001/preview"}
        </div>

        <section style={card}>
          <h3>Customer Account</h3>

          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              padding: 12,
              width: "100%",
              fontSize: 16
            }}
          >
            {accounts.map(a => (
              <option value={a.id} key={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {account && (
            <div style={{ marginTop: 18 }}>
              <h2>{account.name}</h2>
              <p>Industry: {account.industry || "Not specified"}</p>
              <p>City: {account.city || "Not specified"}</p>
              <p>Employees: {account.employees ?? "Not specified"}</p>
            </div>
          )}
        </section>

        <section style={{
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          marginTop: 20
        }}>
          <div style={{ ...card, flex: 1, marginTop: 0 }}>
            <h2>{policies.length}</h2>
            <p>Insurance Policies</p>
          </div>

          <div style={{ ...card, flex: 1, marginTop: 0 }}>
            <h2>{money(totalPremium)}</h2>
            <p>Total Recorded Premium</p>
          </div>
        </section>

        <section style={card}>
          <h3>Insurance Policies</h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr>
                  {["Policy", "Policy Type", "Premium", "Expiration"].map(h => (
                    <th key={h} style={{
                      padding: 12,
                      textAlign: "left",
                      borderBottom: "2px solid #ddd"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {policies.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: 12 }}>{p.name}</td>
                    <td style={{ padding: 12 }}>
                      {policyLabels[p.name] || "Not specified"}
                    </td>
                    <td style={{ padding: 12 }}>{money(p.premium)}</td>
                    <td style={{ padding: 12 }}>
                      {formatDate(p.expirationDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {policies.length === 0 && (
            <p>No policies linked to this Account.</p>
          )}
        </section>

        <p style={{ fontSize: 12, color: "#64748b", marginTop: 20 }}>
          Read-only Salesforce demo. Policy type labels are mapped
          from HRP demo identifiers.
        </p>

        {typeof window !== "undefined" &&
          window.parent !== window && <McpConnection />}
      </div>
    </main>
  );
}
