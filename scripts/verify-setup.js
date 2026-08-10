import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
const dnsPromises = dns.promises;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log("   VERIFY.963.CO.ZA - SYSTEM INTEGRITY CHECK");
console.log("==========================================");

const root = path.join(__dirname, '..');

// 1. Check agconnect-services.json
const agcPath = path.join(root, 'frontend', 'android', 'app', 'agconnect-services.json');
let agcAppId = "";
if (fs.existsSync(agcPath)) {
    const agc = JSON.parse(fs.readFileSync(agcPath, 'utf8'));
    agcAppId = agc.client.app_id;
    console.log("[PASS] agconnect-services.json found.");
    console.log(`       - App ID: ${agcAppId}`);
    console.log(`       - Package: ${agc.client.package_name}`);
    console.log(`       - Region: ${agc.region}`);

    if (agc.region !== "SG") {
        console.warn(`[WARN] Region is ${agc.region}, but SG is expected for this project.`);
    }
} else {
    console.error("[FAIL] agconnect-services.json is MISSING!");
}

// 2. Check .env consistency
const backendEnvPath = path.join(root, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    const appIdMatch = content.match(/HUAWEI_APP_ID=(\d+)/);
    const clientIdMatch = content.match(/HUAWEI_CLIENT_ID=(\d+)/);
    const regionMatch = content.match(/HMS_REGION=([a-zA-Z]+)/);
    const secretMatch = content.match(/HUAWEI_CLIENT_SECRET=([a-zA-Z0-9]+)/);

    if (appIdMatch) {
        console.log(`[PASS] Backend HUAWEI_APP_ID: ${appIdMatch[1]}`);
        if (agcAppId && appIdMatch[1] !== agcAppId) {
            console.error(`[FAIL] App ID Mismatch! agconnect has ${agcAppId}, .env has ${appIdMatch[1]}`);
        }
    }
    if (clientIdMatch) console.log(`[PASS] Backend HUAWEI_CLIENT_ID: ${clientIdMatch[1]}`);
    if (regionMatch) console.log(`[PASS] Backend HMS_REGION: ${regionMatch[1]}`);

    if (secretMatch) {
        const secret = secretMatch[1];
        // Both secrets are valid depending on context:
        // E7FD... is the Project Client Secret (Correct for IAP)
        // 4def... is the OAuth 2.0 Client Secret (Correct for Login)
        if (secret.startsWith("E7FD1A")) {
            console.log("[PASS] HUAWEI_CLIENT_SECRET starts with E7FD1A (Project Secret - Correct for IAP).");
        } else if (secret.startsWith("4deff9")) {
            console.log("[PASS] HUAWEI_CLIENT_SECRET starts with 4deff9 (OAuth Secret).");
        } else {
            console.warn(`[WARN] HUAWEI_CLIENT_SECRET starts with ${secret.substring(0,6)}... which is neither the Project nor OAuth secret.`);
        }
    }
}

// 3. DNS and Connectivity
async function runTests() {
    console.log("\n[CHECK] Testing DNS Resolution...");
    try {
        const verifyIps = await dnsPromises.resolve4('verify.963.co.za');
        console.log(`[PASS] verify.963.co.za resolves to: ${verifyIps.join(', ')}`);
    } catch (err) {
        console.error(`[FAIL] Could not resolve verify.963.co.za: ${err.message}`);
    }

    try {
        const appIps = await dnsPromises.resolve4('app.963.co.za');
        console.log(`[PASS] app.963.co.za resolves to: ${appIps.join(', ')}`);
    } catch (err) {
        console.error(`[FAIL] Could not resolve app.963.co.za: ${err.message}`);
    }

    console.log("\n[CHECK] Testing Connectivity...");

    const endpoints = [
        { name: "HMS Gateway (Worker)", url: "https://verify.963.co.za/api/test" },
        { name: "Vercel Backend (API)", url: "https://app.963.co.za/api/languages" },
        { name: "Public Web (Google)", url: "https://google.com" }
    ];

    for (const item of endpoints) {
        try {
            console.log(`[TEST] Fetching ${item.name}...`);
            const res = await fetch(item.url, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
                console.log(`[PASS] Reachable: ${item.url} (HTTP ${res.status})`);
            } else {
                console.warn(`[WARN] ${item.url} returned HTTP ${res.status}`);
            }
        } catch (err) {
            console.error(`[FAIL] ${item.name} is UNREACHABLE: ${err.message}`);
        }
    }

    console.log("\n==========================================");
    console.log("   SANDBOX PROFILE REMINDER");
    console.log("==========================================");
    console.log("   - Account: jeraquevdb007@gmail.com");
    console.log("   - Nickname: hid40105662");
    console.log("   - Ensure this is added in HMS Console Sandbox.");
    console.log("==========================================");
}

runTests();
