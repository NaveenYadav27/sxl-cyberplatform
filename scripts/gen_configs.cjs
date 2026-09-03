const fs = require('fs');
const path = require('path');

const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    host: true
  }
});
`;

const tsConfig = JSON.stringify({
  compilerOptions: {
    target: "ES2020",
    useDefineForClassFields: true,
    lib: ["ES2020", "DOM", "DOM.Iterable"],
    module: "ESNext",
    skipLibCheck: true,
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react-jsx",
    strict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noFallthroughCasesInSwitch: true
  },
  include: ["src"]
}, null, 2);

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0b0d12',
          darkAlt: '#12151c',
          card: '#151922',
          cardHover: '#1c222e',
          border: '#242a38',
          borderGlow: 'rgba(230, 51, 41, 0.35)',
          accent: '#e63329',
          accentLight: '#ff4a3d',
          accentDim: 'rgba(230, 51, 41, 0.12)',
          accentMid: 'rgba(230, 51, 41, 0.35)',
          teal: '#00f2fe',
          tealDim: 'rgba(0, 242, 254, 0.12)',
          blue: '#2563eb',
          blueDim: 'rgba(37, 99, 235, 0.12)',
          purple: '#8b5cf6',
          purpleDim: 'rgba(139, 92, 246, 0.12)',
          green: '#10b981',
          greenDim: 'rgba(16, 185, 129, 0.12)',
          warning: '#f59e0b',
          warningDim: 'rgba(245, 158, 11, 0.12)',
          danger: '#ef4444',
          dangerDim: 'rgba(239, 68, 68, 0.12)'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Poppins', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
`;

const indexHtml = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ShadowXLab — Visual Network Engineering & Cybersecurity Training Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    (function(){
      try {
        var t = localStorage.getItem('shadowxlab-theme');
        var d = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', t || (d ? 'dark' : 'light'));
      } catch(e) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  </script>
</head>
<body class="bg-[#0b0d12] text-[#e8ecf4] font-sans antialiased selection:bg-red-500 selection:text-white">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-deep: #f6f7f9;
    --bg-card: #ffffff;
    --bg-card-hover: #fdf4f3;
    --bg-deep-alt: #f1f2f5;
    --border: #e3e6ea;
    --border-glow: rgba(230, 51, 41, 0.2);
    --accent: #e63329;
    --accent-light: #ff4a3d;
    --accent-dim: rgba(230, 51, 41, 0.08);
    --accent-mid: rgba(230, 51, 41, 0.25);
    --text: #1c2b3a;
    --text-muted: #5b6b7a;
    --text-dim: #93a1ae;
  }

  html[data-theme="dark"] {
    --bg-deep: #0b0d12;
    --bg-card: #151922;
    --bg-card-hover: #1c222e;
    --bg-deep-alt: #0e1117;
    --border: #242a38;
    --border-glow: rgba(230, 51, 41, 0.35);
    --accent: #ff4a3d;
    --accent-light: #ff6f61;
    --accent-dim: rgba(255, 74, 61, 0.12);
    --accent-mid: rgba(255, 74, 61, 0.35);
    --text: #e8ecf4;
    --text-muted: #8b96a8;
    --text-dim: #4d5b70;
  }

  body {
    background-color: var(--bg-deep);
    color: var(--text);
    font-family: 'Poppins', 'Inter', sans-serif;
    min-height: 100vh;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-deep);
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

.radar-sweep {
  background: conic-gradient(from 0deg at 50% 50%, rgba(230, 51, 41, 0) 0deg, rgba(230, 51, 41, 0.15) 60deg, rgba(230, 51, 41, 0) 65deg);
  animation: spin 4s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.pulse-glow {
  animation: pulseGlow 2.5s infinite;
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(230, 51, 41, 0.2);
  }
  50% {
    box-shadow: 0 0 25px rgba(230, 51, 41, 0.5);
  }
}
`;

fs.writeFileSync('vite.config.ts', viteConfig);
fs.writeFileSync('tsconfig.json', tsConfig);
fs.writeFileSync('postcss.config.js', postcssConfig);
fs.writeFileSync('tailwind.config.js', tailwindConfig);
fs.writeFileSync('index.html', indexHtml);
fs.writeFileSync('src/index.css', indexCss);

console.log('Configs and index.css created successfully');
