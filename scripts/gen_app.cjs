const fs = require('fs');

const appCode = `import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { GlobalSearch } from './components/common/GlobalSearch';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ModulesPage } from './pages/ModulesPage';
import { ModuleDetailPage } from './pages/ModuleDetailPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { LabsPage } from './pages/LabsPage';
import { LabWorkspacePage } from './pages/LabWorkspacePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { PacketAnalyzerPage } from './pages/PacketAnalyzerPage';
import { ProtocolsPage } from './pages/ProtocolsPage';
import { AttacksPage } from './pages/AttacksPage';
import { DefensePage } from './pages/DefensePage';
import { ToolsPage } from './pages/ToolsPage';
import { RolesPage } from './pages/RolesPage';
import { RoleDetailPage } from './pages/RoleDetailPage';
import { MissionsPage } from './pages/MissionsPage';
import { ProgressPage } from './pages/ProgressPage';
import { CapstonePage } from './pages/CapstonePage';

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.hash ? window.location.hash.replace('#', '') || '/' : '/';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const route = window.location.hash ? window.location.hash.replace('#', '') || '/' : '/';
      setCurrentRoute(route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route Dispatcher
  const renderCurrentPage = () => {
    if (currentRoute === '/' || currentRoute === '') {
      return <HomePage navigate={navigate} />;
    }
    if (currentRoute === '/learn') {
      return <LearnPage navigate={navigate} />;
    }
    if (currentRoute === '/roadmap') {
      return <RoadmapPage navigate={navigate} />;
    }
    if (currentRoute === '/modules') {
      return <ModulesPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('/module/')) {
      const moduleId = currentRoute.replace('/module/', '');
      return <ModuleDetailPage moduleId={moduleId} navigate={navigate} />;
    }
    if (currentRoute.startsWith('/topic/')) {
      const topicId = currentRoute.replace('/topic/', '');
      return <TopicDetailPage topicId={topicId} navigate={navigate} />;
    }
    if (currentRoute === '/labs') {
      return <LabsPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('/lab/')) {
      const labId = currentRoute.replace('/lab/', '');
      return <LabWorkspacePage labId={labId} navigate={navigate} />;
    }
    if (currentRoute === '/simulator') {
      return <SimulatorPage />;
    }
    if (currentRoute === '/packet-analyzer') {
      return <PacketAnalyzerPage />;
    }
    if (currentRoute === '/protocols') {
      return <ProtocolsPage />;
    }
    if (currentRoute === '/attacks') {
      return <AttacksPage />;
    }
    if (currentRoute === '/defense') {
      return <DefensePage />;
    }
    if (currentRoute === '/tools') {
      return <ToolsPage />;
    }
    if (currentRoute === '/roles') {
      return <RolesPage navigate={navigate} />;
    }
    if (currentRoute.startsWith('/role/')) {
      const roleId = currentRoute.replace('/role/', '');
      return <RoleDetailPage roleId={roleId} navigate={navigate} />;
    }
    if (currentRoute === '/missions') {
      return <MissionsPage navigate={navigate} />;
    }
    if (currentRoute === '/progress') {
      return <ProgressPage />;
    }
    if (currentRoute === '/capstone') {
      return <CapstonePage navigate={navigate} />;
    }

    return <HomePage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#0b0d12] text-[#e8ecf4] flex flex-col selection:bg-red-500 selection:text-white font-sans">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRoute={currentRoute}
        navigate={navigate}
      />

      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
      />

      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      <Footer navigate={navigate} />
    </div>
  );
};
`;

const mainCode = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ProgressProvider } from './context/ProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </ThemeProvider>
  </React.StrictMode>
);
`;

fs.writeFileSync('src/App.tsx', appCode);
fs.writeFileSync('src/main.tsx', mainCode);

console.log('App.tsx and main.tsx generated successfully');
