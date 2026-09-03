const fs = require('fs');

let cvf = fs.readFileSync('src/components/common/ConceptVisualFlow.tsx', 'utf8');

// Prepend import
cvf = `import { ClientSwitchRouterFlow } from '../simulators/ClientSwitchRouterFlow';\n` + cvf;

// In concept.id === 'c-01-01', we can embed ClientSwitchRouterFlow directly as the primary interactive visual flow!
cvf = cvf.replace(
  "// Client-Server vs Reverse Shell Visual Flow (c-01-01)",
  "// Client-Server vs Reverse Shell Visual Flow (c-01-01)\n  if (concept.id === 'c-01-01') {\n    return (\n      <div className=\"space-y-4\">\n        <ClientSwitchRouterFlow />\n      </div>\n    );\n  }"
);

fs.writeFileSync('src/components/common/ConceptVisualFlow.tsx', cvf);
console.log('ConceptVisualFlow.tsx updated with ClientSwitchRouterFlow');
