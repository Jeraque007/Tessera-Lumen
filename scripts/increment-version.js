import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Increment patch version
const parts = pkg.version.split('.');
parts[2] = parseInt(parts[2]) + 1;
pkg.version = parts.join('.');

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log(`[Version] Incremented to ${pkg.version}`);
