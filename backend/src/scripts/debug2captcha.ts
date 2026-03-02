const API_KEY = 'd026d41a1ee066251d44318052ac07a8';
const siteKey = '0x4AAAAAAADnPIDROrmt1Wwj';
const pageUrl = 'https://www.rdv-prefecture.interieur.gouv.fr/rdvpref/reservation/demarche/16040/cgu/';

async function main() {
  console.log('Testing Cloudflare Challenge task types...\n');

  // Test 1: TurnstileTaskProxyless with cloudflareTaskType
  const tests = [
    {
      name: 'TurnstileTask + challenge type',
      body: {
        clientKey: API_KEY,
        task: {
          type: 'TurnstileTaskProxyless',
          websiteURL: pageUrl,
          websiteKey: siteKey,
          cloudflareTaskType: 'challenge',
        },
      },
    },
    {
      name: 'TurnstileTask + turnstile type',
      body: {
        clientKey: API_KEY,
        task: {
          type: 'TurnstileTaskProxyless',
          websiteURL: pageUrl,
          websiteKey: siteKey,
          cloudflareTaskType: 'turnstile',
        },
      },
    },
    {
      name: 'AntiCloudflareTask',
      body: {
        clientKey: API_KEY,
        task: {
          type: 'AntiCloudflareTask',
          websiteURL: pageUrl,
          websiteKey: siteKey,
        },
      },
    },
    {
      name: 'TurnstileTask with metadata',
      body: {
        clientKey: API_KEY,
        task: {
          type: 'TurnstileTaskProxyless',
          websiteURL: pageUrl,
          websiteKey: siteKey,
          metadata: { type: 'challenge' },
        },
      },
    },
  ];

  for (const test of tests) {
    try {
      console.log(`--- ${test.name} ---`);
      const r = await fetch('https://api.2captcha.com/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      const d = await r.text();
      console.log(`Response: ${d}\n`);
    } catch (e) {
      console.log(`Error: ${e}\n`);
    }
  }

  // Also try legacy with action parameter
  const legacyTests = [
    `key=${API_KEY}&method=turnstile&sitekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&action=managed&json=1`,
    `key=${API_KEY}&method=turnstile&sitekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&data=${encodeURIComponent(JSON.stringify({type:'challenge'}))}&json=1`,
  ];

  for (let i = 0; i < legacyTests.length; i++) {
    try {
      console.log(`--- Legacy test ${i+1} ---`);
      const r = await fetch(`http://2captcha.com/in.php?${legacyTests[i]}`);
      const d = await r.text();
      console.log(`Response: ${d}\n`);
    } catch (e) {
      console.log(`Error: ${e}\n`);
    }
  }
}

main();
