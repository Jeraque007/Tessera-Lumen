const fs = require('fs');
const path = require('path');

console.log("==========================================");
console.log("   VERIFY.963.CO.ZA - SYSTEM INTEGRITY CHECK");
console.log("==========================================");

const root = path.join(__dirname, '..');

// 1. Check agconnect-services.json
const agcPath = path.join(root, 'frontend', 'android', 'app', 'agconnect-services.json');
if (fs.existsSync(agcPath)) {
    const agc = JSON.parse(fs.readFileSync(agcPath, 'utf8'));
    console.log("[PASS] agconnect-services.json found.");
    console.log(`       - App ID: ${agc.client.app_id}`);
    console.log(`       - Package: ${agc.client.package_name}`);
    console.log(`       - Region: ${agc.region}`);
} else {
    console.error("[FAIL] agconnect-services.json is MISSING!");
}

// 2. Check .env consistency
const backendEnvPath = path.join(root, 'backend', '.env');
if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    const appIdMatch = content.match(/HUAWEI_APP_ID=(\d+)/);
    const clientIdMatch = content.match(/HUAWEI_CLIENT_ID=(\d+)/);

    if (appIdMatch) console.log(`[PASS] Backend HUAWEI_APP_ID: ${appIdMatch[1]}`);
    if (clientIdMatch) console.log(`[PASS] Backend HUAWEI_CLIENT_ID: ${clientIdMatch[1]}`);
}

// 3. Check Frontend config
const capConfigPath = path.join(root, 'frontend', 'capacitor.config.ts');
if (fs.existsSync(capConfigPath)) {
    const content = fs.readFileSync(capConfigPath, 'utf8');
    const appIdMatch = content.match(/appId:\s*["']([^"']+)["']/);
    if (appIdMatch) {
        console.log(`[PASS] Capacitor App ID: ${appIdMatch[1]}`);
    }
}

// 4. Remote Connectivity (Health Check)
// Note: This requires 'node-fetch' or similar if run in Node < 18,
// but modern Node has global fetch.
async function checkConnectivity() {
    console.log("\n[CHECK] Testing verify.963.co.za connectivity...");
    try {
        const res = await fetch("https://verify.963.co.za/api/health");
        if (res.ok) {
            const data = await res.json();
            console.log(`[PASS] verify.963.co.za is ONLINE. Status: ${data.status}`);
        } else {
            console.error(`[FAIL] verify.963.co.za returned HTTP ${res.status}`);
        }
    } catch (err) {
        console.error(`[FAIL] Could not reach verify.963.co.za: ${err.message}`);
    }
}

checkConnectivity();
