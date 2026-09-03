const fs = require('fs');

// Fix GlobalSearch.tsx
let gs = fs.readFileSync('src/components/common/GlobalSearch.tsx', 'utf8');
gs = gs.replace("import { PROTOCOLS, PORTS } from '../../data/protocols';", "import { PROTOCOLS } from '../../data/protocols';\nimport { PORTS } from '../../data/ports';\nimport { PortInfo } from '../../types';");
gs = gs.replace("PORTS.forEach((p) => {", "PORTS.forEach((p: PortInfo) => {");
fs.writeFileSync('src/components/common/GlobalSearch.tsx', gs);

// Fix ProtocolsPage.tsx
let pp = fs.readFileSync('src/pages/ProtocolsPage.tsx', 'utf8');
pp = pp.replace("import { PROTOCOLS, PORTS } from '../data/protocols';", "import { PROTOCOLS } from '../data/protocols';\nimport { PORTS } from '../data/ports';\nimport { PortInfo } from '../types';");
pp = pp.replace("const filteredPorts = PORTS.filter((p) =>", "const filteredPorts = PORTS.filter((p: PortInfo) =>");
pp = pp.replace("{filteredPorts.map((p) => (", "{filteredPorts.map((p: PortInfo) => (");
fs.writeFileSync('src/pages/ProtocolsPage.tsx', pp);

console.log('Fixed PORTS imports and typing in GlobalSearch and ProtocolsPage');
