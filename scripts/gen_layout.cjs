const fs = require('fs');

const navbarCode = `import React, { useState } from 'react';
import { Shield, Search, Moon, Sun, Menu, X, Award, Terminal, Activity } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useProgress } from '../../context/ProgressContext';
import { ROLES } from '../../data/roles';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  onOpenSearch,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const { progress } = useProgress();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectedRole = ROLES.find((r) => r.id === progress.selectedRoleId) || ROLES[0];

  const navLinks = [
    { label: 'Learn', route: '/learn' },
    { label: 'Roadmap', route: '/roadmap' },
    { label: 'Labs', route: '/labs' },
    { label: 'Simulator', route: '/simulator' },
    { label: 'Analyzer', route: '/packet-analyzer' },
    { label: 'Protocols', route: '/protocols' },
    { label: 'Attacks', route: '/attacks' },
    { label: 'Defense', route: '/defense' },
    { label: 'Tools', route: '/tools' },
    { label: 'Roles', route: '/roles' },
    { label: 'Missions', route: '/missions' },
    { label: 'Progress', route: '/progress' },
    { label: 'Capstone', route: '/capstone' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b0d12]/90 dark:bg-[#0b0d12]/90 backdrop-blur-md border-b border-[#242a38]">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-[#242a38] text-gray-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 transition"
            title="Toggle Curriculum Navigator"
            aria-label="Toggle Curriculum Navigator"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-red-500/20 group-hover:scale-105 transition">
              SX
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">
                Shadow<span className="text-red-500">XLab</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-widest text-gray-400 border-l border-[#242a38] pl-2">
                Networking
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.route || currentRoute.startsWith(link.route + '/');
            return (
              <button
                key={link.route}
                onClick={() => navigate(link.route)}
                className={\`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap \${
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-[#181c26]'
                }\`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Search, Active Role Badge, Theme, Mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Quick Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#242a38] bg-[#12151c] text-gray-400 hover:text-white hover:border-red-500/40 text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">Search Lab...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-[#181c26] border border-[#242a38] rounded text-gray-400">
              Ctrl+K
            </kbd>
          </button>

          {/* User Active Role & XP Pill */}
          <button
            onClick={() => navigate('/progress')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[#242a38] bg-[#12151c] hover:border-red-500/30 text-xs transition"
          >
            <Award className="w-3.5 h-3.5 text-yellow-400" />
            <span className="font-mono text-xs font-semibold text-yellow-400">
              Lvl {progress.level}
            </span>
            <span className="text-[11px] text-gray-400 hidden lg:inline border-l border-[#242a38] pl-2">
              {selectedRole.code}
            </span>
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[#242a38] text-gray-400 hover:text-white hover:bg-[#181c26] transition"
            aria-label="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg border border-[#242a38] text-gray-400 hover:text-white hover:bg-[#181c26] transition"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#242a38] bg-[#0e1117] px-4 py-3 space-y-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.route || currentRoute.startsWith(link.route + '/');
              return (
                <button
                  key={link.route}
                  onClick={() => {
                    navigate(link.route);
                    setMobileMenuOpen(false);
                  }}
                  className={\`px-3 py-2 rounded-lg text-left text-xs font-medium transition \${
                    isActive
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-semibold'
                      : 'text-gray-300 hover:bg-[#181c26]'
                  }\`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
`;

const sidebarCode = `import React from 'react';
import { PHASES } from '../../data/curriculum';
import { CheckCircle2, Circle, ChevronRight, X, Shield, BookOpen, Layers } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentRoute, navigate }) => {
  const { progress } = useProgress();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile / overlay mode */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <aside className="fixed left-0 top-14 bottom-0 w-80 bg-[#0e1117] border-r border-[#242a38] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#242a38] flex items-center justify-between bg-[#12151c]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Curriculum (23 Phases)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#181c26]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {PHASES.map((phase) => {
            const isPhaseActive = currentRoute.includes(phase.id) || (currentRoute === '/module/' + phase.id);
            const isCompleted = phase.topics.every((t) => progress.completedTopics.includes(t.id));

            return (
              <div key={phase.id} className="space-y-0.5">
                <button
                  onClick={() => {
                    navigate('/module/' + phase.id);
                    onClose();
                  }}
                  className={\`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition \${
                    isPhaseActive
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30 font-semibold'
                      : 'text-gray-300 hover:bg-[#181c26]'
                  }\`}
                >
                  <span className="font-mono text-[10px] text-gray-400 w-5 flex-shrink-0">
                    {phase.phaseNumber < 10 ? '0' + phase.phaseNumber : phase.phaseNumber}
                  </span>
                  <span className="truncate flex-1 font-medium">{phase.title}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Quick Stats */}
        <div className="p-3 border-t border-[#242a38] bg-[#12151c] text-xs flex items-center justify-between text-gray-400 font-mono">
          <span>Topics: {progress.completedTopics.length} done</span>
          <button
            onClick={() => {
              navigate('/roadmap');
              onClose();
            }}
            className="text-red-400 hover:underline font-semibold"
          >
            Full Roadmap ?
          </button>
        </div>
      </aside>
    </>
  );
};
`;

const footerCode = `import React from 'react';
import { Shield, Terminal, Activity, BookOpen, Lock } from 'lucide-react';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="border-t border-[#242a38] bg-[#0a0c10] text-gray-400 py-10 mt-20 text-xs">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                SX
              </div>
              <span className="font-bold text-sm text-white">ShadowXLab Networking</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-3">
              Visual Network Engineering & Cybersecurity Training Platform. Teaching networking as the foundational substrate of offensive and defensive security operations.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              ALL SIMULATION ENGINES ONLINE
            </div>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-3">
              Training Modules
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => navigate('/learn')} className="hover:text-red-400 transition">Curriculum (23 Phases)</button></li>
              <li><button onClick={() => navigate('/roadmap')} className="hover:text-red-400 transition">Interactive Roadmap</button></li>
              <li><button onClick={() => navigate('/labs')} className="hover:text-red-400 transition">Guided Labs Library</button></li>
              <li><button onClick={() => navigate('/capstone')} className="hover:text-red-400 transition">Enterprise Capstone</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-3">
              Simulation Lab Suite
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => navigate('/simulator')} className="hover:text-red-400 transition">Network Topology & Packets</button></li>
              <li><button onClick={() => navigate('/packet-analyzer')} className="hover:text-red-400 transition">Wireshark Analyzer</button></li>
              <li><button onClick={() => navigate('/protocols')} className="hover:text-red-400 transition">Port & Protocol Explorer</button></li>
              <li><button onClick={() => navigate('/attacks')} className="hover:text-red-400 transition">Attack ? Defense Matrix</button></li>
              <li><button onClick={() => navigate('/tools')} className="hover:text-red-400 transition">Simulated CLI Terminals</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-3">
              Role Pathways
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => navigate('/role/role-soc-l1')} className="hover:text-red-400 transition">SOC Analyst Tier 1</button></li>
              <li><button onClick={() => navigate('/role/role-vapt')} className="hover:text-red-400 transition">Network Penetration Tester</button></li>
              <li><button onClick={() => navigate('/role/role-dfir')} className="hover:text-red-400 transition">DFIR Network Specialist</button></li>
              <li><button onClick={() => navigate('/role/role-net-sec')} className="hover:text-red-400 transition">Network Security Engineer</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1c222e] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            � 2026 ShadowXLab Cybersecurity Platform � Authorized Offline-First Training Twin
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">RFC Compliant</span>
            <span className="text-gray-400">Zero External API Dependencies</span>
            <span className="text-red-400 font-semibold">v2.4 Production</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
`;

const globalSearchCode = `import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Shield, Radio, Terminal, Cpu, FileText, ArrowRight } from 'lucide-react';
import { PHASES } from '../../data/curriculum';
import { PROTOCOLS, PORTS } from '../../data/protocols';
import { ATTACKS } from '../../data/attacks';
import { LABS } from '../../data/labs';
import { COMMANDS } from '../../data/commands';
import { ROLES } from '../../data/roles';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (route: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, navigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Aggregate results
  const results: { category: string; title: string; subtitle: string; route: string; icon: any }[] = [];

  if (q.length > 0) {
    // Phases & Topics
    PHASES.forEach((phase) => {
      if (phase.title.toLowerCase().includes(q) || phase.description.toLowerCase().includes(q)) {
        results.push({
          category: 'Curriculum Phase',
          title: phase.title,
          subtitle: phase.subtitle,
          route: '/module/' + phase.id,
          icon: BookOpen
        });
      }
      phase.topics.forEach((topic) => {
        if (topic.title.toLowerCase().includes(q) || topic.summary.toLowerCase().includes(q)) {
          results.push({
            category: 'Topic',
            title: topic.title,
            subtitle: phase.title,
            route: '/topic/' + topic.id,
            icon: FileText
          });
        }
        topic.concepts.forEach((concept) => {
          if (concept.title.toLowerCase().includes(q) || concept.detailedContent.toLowerCase().includes(q)) {
            results.push({
              category: 'Concept',
              title: concept.title,
              subtitle: topic.title,
              route: '/topic/' + topic.id,
              icon: Cpu
            });
          }
        });
      });
    });

    // Protocols
    PROTOCOLS.forEach((proto) => {
      if (proto.name.toLowerCase().includes(q) || proto.shortName.toLowerCase().includes(q) || proto.purpose.toLowerCase().includes(q)) {
        results.push({
          category: 'Protocol',
          title: \`\${proto.shortName} - \${proto.name}\`,
          subtitle: \`Layer: \${proto.layer} � \${proto.purpose}\`,
          route: '/protocols',
          icon: Radio
        });
      }
    });

    // Ports
    PORTS.forEach((p) => {
      if (p.port.toString().includes(q) || p.service.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q)) {
        results.push({
          category: 'Port / Service',
          title: \`Port \${p.port} (\${p.service})\`,
          subtitle: \`Risk: \${p.securityRisk} � \${p.purpose}\`,
          route: '/protocols',
          icon: Radio
        });
      }
    });

    // Attacks
    ATTACKS.forEach((atk) => {
      if (atk.name.toLowerCase().includes(q) || atk.description.toLowerCase().includes(q) || atk.targetProtocol.toLowerCase().includes(q)) {
        results.push({
          category: 'Attack Technique',
          title: atk.name,
          subtitle: \`Category: \${atk.category} � Target: \${atk.targetProtocol}\`,
          route: '/attacks',
          icon: Shield
        });
      }
    });

    // Labs
    LABS.forEach((lab) => {
      if (lab.title.toLowerCase().includes(q) || lab.scenario.toLowerCase().includes(q)) {
        results.push({
          category: 'Guided Lab',
          title: lab.title,
          subtitle: \`Category: \${lab.category} � Difficulty: \${lab.difficulty}\`,
          route: '/lab/' + lab.id,
          icon: Terminal
        });
      }
    });

    // Commands
    COMMANDS.forEach((cmd) => {
      if (cmd.command.toLowerCase().includes(q) || cmd.purpose.toLowerCase().includes(q)) {
        results.push({
          category: 'CLI Command',
          title: cmd.command,
          subtitle: cmd.purpose,
          route: '/tools',
          icon: Terminal
        });
      }
    });

    // Roles
    ROLES.forEach((r) => {
      if (r.title.toLowerCase().includes(q) || r.shortDesc.toLowerCase().includes(q)) {
        results.push({
          category: 'Career Role',
          title: r.title,
          subtitle: r.shortDesc,
          route: '/role/' + r.id,
          icon: BookOpen
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-[#12151c] border border-[#242a38] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-[#242a38] flex items-center gap-3 bg-[#151922]">
          <Search className="w-5 h-5 text-red-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search concepts, protocols, ports, attacks, labs, commands, roles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-full font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#1f2533]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-[#1e2430]">
          {q.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              <p className="mb-2 font-mono text-gray-400">Type a search term to find any network concept, attack, lab, or protocol.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['TCP Handshake', 'DNS Tunneling', 'Subnetting', 'ARP Spoofing', 'Port 445', 'Wireshark', 'SOC L1', 'Firewall'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded bg-[#181c26] text-gray-300 hover:text-white hover:border-red-500/40 border border-[#242a38] font-mono text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No direct matches found for &quot;<span className="text-white font-mono">{query}</span>&quot;. Try searching for &quot;TCP&quot;, &quot;DNS&quot;, &quot;ARP&quot;, or &quot;Subnet&quot;.
            </div>
          ) : (
            results.slice(0, 20).map((res, idx) => {
              const Icon = res.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(res.route);
                    onClose();
                  }}
                  className="w-full text-left p-3 hover:bg-[#181c26] rounded-lg transition flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-red-500/10 text-red-400 mt-0.5 group-hover:bg-red-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white group-hover:text-red-400 transition">
                          {res.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#1f2533] text-gray-400 border border-[#2e374a]">
                          {res.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {res.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400 group-hover:translate-x-1 transition" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[#0e1117] border-t border-[#242a38] text-[10px] font-mono text-gray-400 flex items-center justify-between px-4">
          <span>{results.length} results found</span>
          <span>Press ESC or Click outside to close</span>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/layout/Navbar.tsx', navbarCode);
fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarCode);
fs.writeFileSync('src/components/layout/Footer.tsx', footerCode);
fs.writeFileSync('src/components/common/GlobalSearch.tsx', globalSearchCode);

console.log('Layout & GlobalSearch components generated successfully');
