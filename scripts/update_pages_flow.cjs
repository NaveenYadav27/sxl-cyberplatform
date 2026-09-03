const fs = require('fs');

// Update SimulatorPage.tsx
let sim = fs.readFileSync('src/pages/SimulatorPage.tsx', 'utf8');
sim = `import { ClientSwitchRouterFlow } from '../components/simulators/ClientSwitchRouterFlow';\n` + sim;
sim = sim.replace(
  "{ id: 'topology', label: 'Network Topology' },",
  "{ id: 'hop-flow', label: 'Client ? Server Flow' },\n    { id: 'topology', label: 'Enterprise Digital Twin' },"
);
sim = sim.replace(
  "{activeTab === 'topology' && <VisualTopology />}",
  "{activeTab === 'hop-flow' && <ClientSwitchRouterFlow />}\n        {activeTab === 'topology' && <VisualTopology />}"
);
fs.writeFileSync('src/pages/SimulatorPage.tsx', sim);

// Update HomePage.tsx
let home = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');
home = `import { ClientSwitchRouterFlow } from '../components/simulators/ClientSwitchRouterFlow';\n` + home;
home = home.replace(
  "<VisualTopology onSelectNode={(node) => console.log('Selected node:', node.name)} />",
  `<div className="space-y-6">
          <ClientSwitchRouterFlow />
          <VisualTopology onSelectNode={(node) => console.log('Selected node:', node.name)} />
        </div>`
);
fs.writeFileSync('src/pages/HomePage.tsx', home);

console.log('Updated SimulatorPage.tsx and HomePage.tsx with ClientSwitchRouterFlow');
