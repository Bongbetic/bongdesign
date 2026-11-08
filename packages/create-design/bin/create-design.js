#!/usr/bin/env node
// Scaffold a Vite + React app on @bongbetic/design. Node standard library only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REGISTRY = 'https://git.bongbetic.com/api/packages/bongbetic/npm/';
const template = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'template');

const args = process.argv.slice(2);
const sovereign = args.includes('--sovereign');
const name = args.find((a) => !a.startsWith('--'));

function fail(msg) {
  console.error(`create-design: ${msg}`);
  console.error('usage: npx @bongbetic/create-design <app-name> [--sovereign]');
  process.exit(1);
}

if (!name) fail('app name required');
if (!/^[a-z0-9][a-z0-9._-]*$/.test(name)) fail(`invalid app name "${name}" (lowercase letters, digits, . _ -)`);

const dest = path.resolve(process.cwd(), name);
if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) fail(`${name} exists and is not empty`);

function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    // npm drops .gitignore from packages, so the template ships it as "gitignore".
    const to = path.join(dst, entry.name === 'gitignore' ? '.gitignore' : entry.name);
    if (entry.isDirectory()) copy(from, to);
    else if (/\.(json|html|jsx|js|scss|md)$/.test(entry.name) || entry.name === 'gitignore') {
      fs.writeFileSync(to, fs.readFileSync(from, 'utf8').replaceAll('__NAME__', name));
    } else fs.copyFileSync(from, to);
  }
}

copy(template, dest);

// Reading needs no token. Sovereign mode sends every package, third-party too, through Gitea.
const npmrc = sovereign ? `registry=${REGISTRY}\n` : `@bongbetic:registry=${REGISTRY}\n`;
fs.writeFileSync(path.join(dest, '.npmrc'), npmrc);

console.log(`Created ${name}${sovereign ? ' (sovereign: all packages from git.bongbetic.com)' : ''}.\n`);
console.log(`  cd ${name}\n  npm install\n  npm run dev\n`);
