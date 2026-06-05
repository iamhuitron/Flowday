#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(),'package.json');
if(!fs.existsSync(p)){ console.error('package.json not found in current directory. Run this script from the repo root.'); process.exit(2); }
const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
pkg.scripts = pkg.scripts || {};
let changed = false;
if(!pkg.scripts.web){ pkg.scripts.web = 'npx expo start --web'; changed = true; }
if(!pkg.scripts['build:web']){ pkg.scripts['build:web'] = 'npx expo export:web --output-dir web-build'; changed = true; }
if(!pkg.scripts.build){ pkg.scripts.build = 'npm run build:web'; changed = true; }
if(!pkg.scripts['preview:web']){ pkg.scripts['preview:web'] = 'npx serve web-build'; changed = true; }
if(changed){ fs.writeFileSync(p, JSON.stringify(pkg, null, 2)+'\n'); console.log('Updated package.json with web/build:web scripts.'); }
else{ console.log('package.json already has web/build:web scripts. No changes made.'); }
