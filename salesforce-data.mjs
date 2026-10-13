
const ACCOUNT_SOQL =
  "SELECT Id, Name, Industry, NumberOfEmployees, BillingCity FROM Account " +
  "WHERE Name IN ('PulseLab Fitness', 'Voltway Energy') ORDER BY Name";

const POLICY_SOQL =
  "SELECT Id, Name, NameInsuredId, PremiumAmount, " +
  "EffectiveDate, ExpirationDate FROM InsurancePolicy " +
  "WHERE NameInsured.Name = 'PulseLab Fitness' ORDER BY Name";

async function getSalesforceToken() {
  const loginUrl = process.env.SALESFORCE_LOGIN_URL;
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;

  if (!loginUrl || !clientId || !clientSecret) {
    throw new Error("Salesforce OAuth environment variables missing");
  }

  const response = await fetch(
    `${loginUrl.replace(/\/$/, "")}/services/oauth2/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!response.ok) {
    throw new Error(`Salesforce OAuth failed: HTTP ${response.status}`);
  }

  const token = await response.json();

  if (!token.access_token || !token.instance_url) {
    throw new Error("Salesforce OAuth returned incomplete credentials");
  }

  return token;
}

async function querySalesforce(soql, token) {
  const url = new URL(
    "/services/data/v62.0/query",
    token.instance_url
  );

  url.searchParams.set("q", soql);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Salesforce query failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.records || [];
}

export async function getInsuranceDemoData() {
  const token = await getSalesforceToken();

  const [accounts, policies] = await Promise.all([
    querySalesforce(ACCOUNT_SOQL, token),
    querySalesforce(POLICY_SOQL, token)
  ]);

  return {
    accounts: accounts.map(a => ({
      id: a.Id,
      name: a.Name,
      industry: a.Industry,
      employees: a.NumberOfEmployees,
      city: a.BillingCity
    })),
    policies: policies.map(p => ({
      id: p.Id,
      name: p.Name,
      accountId: p.NameInsuredId,
      premium: p.PremiumAmount,
      effectiveDate: p.EffectiveDate,
      expirationDate: p.ExpirationDate
    }))
  };
}

if (process.argv[1]?.endsWith("salesforce-data.mjs")) {
  try {
    const data = await getInsuranceDemoData();

    console.log("Accounts:", data.accounts.map(a => a.name));
    console.log("Total Policies:", data.policies.length);
    console.log(
      "Total Premium:",
      data.policies.reduce((sum, p) => sum + (p.premium || 0), 0)
    );
  } catch (error) {
    console.error("Salesforce Error:", error.message);
    process.exitCode = 1;
  }
}
