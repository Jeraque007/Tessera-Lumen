const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../frontend/android/app/build.gradle');
let content = fs.readFileSync(gradlePath, 'utf8');

// 1. Increment versionCode
const versionCodeRegex = /versionCode\s+(\d+)/;
const currentVersionCode = parseInt(content.match(versionCodeRegex)[1]);
const nextVersionCode = currentVersionCode + 1;
content = content.replace(versionCodeRegex, `versionCode ${nextVersionCode}`);

// 2. Increment versionName (e.g., 1.0.7 -> 1.0.8)
const versionNameRegex = /versionName\s+"([^"]+)"/;
const currentVersionName = content.match(versionNameRegex)[1];
const parts = currentVersionName.split('.');
if (parts.length === 3) {
    parts[2] = parseInt(parts[2]) + 1;
    const nextVersionName = parts.join('.');
    content = content.replace(versionNameRegex, `versionName "${nextVersionName}"`);
    console.log(`[Version] Updated: ${currentVersionName} (${currentVersionCode}) -> ${nextVersionName} (${nextVersionCode})`);
} else {
    console.log(`[Version] Updated versionCode to ${nextVersionCode}. Manual versionName update required.`);
}

fs.writeFileSync(gradlePath, content);
