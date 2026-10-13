
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(exec);
const ORG = 'PexInsDev';

const ACCOUNT_SOQL =
  "SELECT Id, Name, Industry, NumberOfEmployees, BillingCity FROM Account " +
  "WHERE Name IN ('PulseLab Fitness', 'Voltway Energy') ORDER BY Name";

const POLICY_SOQL =
  "SELECT Id, Name, NameInsuredId, PremiumAmount, " +
  "EffectiveDate, ExpirationDate FROM InsurancePolicy " +
  "WHERE NameInsured.Name = 'PulseLab Fitness' ORDER BY Name";

async function querySalesforce(soql) {
  const command =
    `sf data query --query "${soql}" --target-org ${ORG} --json`;

  const { stdout } = await run(command, {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
    timeout: 30000
  });

  const response = JSON.parse(stdout);

  if (response.status !== 0) {
    throw new Error(response.message || 'Salesforce query failed');
  }

  return response.result.records;
}

export async function getInsuranceDemoData() {
  const accounts = await querySalesforce(ACCOUNT_SOQL);
  const policies = await querySalesforce(POLICY_SOQL);

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

try {
  if (process.argv[1]?.endsWith('salesforce-data.mjs')) {
    const data = await getInsuranceDemoData();

    console.log('Accounts:', data.accounts.map(a => a.name));
    console.log('Total Policies:', data.policies.length);
    console.log('Policies:', data.policies.map(p => p.name));
    console.log(
      'Total Premium:',
      data.policies.reduce((sum, p) => sum + (p.premium || 0), 0)
    );
  }
} catch (error) {
  console.error('Salesforce Error:', error.message);
}
