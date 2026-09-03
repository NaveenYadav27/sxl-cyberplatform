const fs = require('fs');

// Fix FoundationsVisualEngine.tsx
let fve = fs.readFileSync('src/components/simulators/FoundationsVisualEngine.tsx', 'utf8');
fve = fve.replace(
  "import { Laptop, Cpu, Hash, Layers, ArrowRight, Play, RotateCcw, AlertTriangle, CheckCircle2, Shield, Wrench, RefreshCw, Radio } from 'lucide-react';",
  "import { Laptop, Cpu, Hash, Layers, ArrowRight, Play, RotateCcw, AlertTriangle, CheckCircle2, Shield, Wrench, RefreshCw, Radio, Server } from 'lucide-react';"
);
fs.writeFileSync('src/components/simulators/FoundationsVisualEngine.tsx', fve);

// Fix SubnettingToolkit.tsx
let st = fs.readFileSync('src/components/simulators/SubnettingToolkit.tsx', 'utf8');
st = st.replace("const maskOcts = [];", "const maskOcts: number[] = [];");
fs.writeFileSync('src/components/simulators/SubnettingToolkit.tsx', st);

console.log('Fixed imports and typing in FoundationsVisualEngine and SubnettingToolkit');
