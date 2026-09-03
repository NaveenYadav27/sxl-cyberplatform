const fs = require('fs');

const homePageCode = `import React from 'react';
import { VisualTopology } from '../components/simulators/VisualTopology';
import { ProgressBar } from '../components/common/ProgressBar';
import { Shield, Radio, Terminal, Award, ArrowRight, Zap, Play, CheckCircle2, Lock } from 'lucide-react';
import { PHASES } from '../data/curriculum';
import { LABS } from '../data/labs';
import { ATTACKS } from '../data/attacks';
import { ROLES } from '../data/roles';

export const HomePage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <div className="space-y-12 max-w-[1520px] mx-auto px-4 sm:px-6 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-4 pb-8 border-b border-[#242a38]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono tracking-wide">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              SHADOWXLAB · VIRTUAL NETWORKING & CYBERSECURITY LABORATORY
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              SEE THE NETWORK. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400">
                UNDERSTAND THE ATTACK.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Master enterprise networking from absolute fundamentals to advanced cybersecurity threat analysis.
              Simulate packet flows, dissect protocols, detect attacks in Wireshark, triage SOC alerts, and defend environments in a live digital twin.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/learn')}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition shadow-lg shadow-red-600/25 flex items-center gap-2"
              >
                <span>Start Learning (23 Phases)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/labs')}
                className="px-6 py-3 rounded-xl bg-[#151922] hover:bg-[#1c222e] text-white border border-[#242a38] font-bold text-sm transition flex items-center gap-2"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Explore 40+ Labs</span>
              </button>

              <button
                onClick={() => navigate('/simulator')}
                className="px-6 py-3 rounded-xl bg-[#151922] hover:bg-[#1c222e] text-white border border-[#242a38] font-bold text-sm transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-yellow-400" />
                <span>Launch Simulators</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Badge Grid */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-80 font-mono text-xs">
            <div className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl shadow-lg">
              <span className="text-gray-400 uppercase text-[10px] block">Curriculum</span>
              <span className="text-xl font-bold text-red-400">23 Phases</span>
              <span className="text-[11px] text-gray-400 block mt-1">100+ Concepts</span>
            </div>
            <div className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl shadow-lg">
              <span className="text-gray-400 uppercase text-[10px] block">Guided Labs</span>
              <span className="text-xl font-bold text-cyan-400">40+ Labs</span>
              <span className="text-[11px] text-gray-400 block mt-1">Hands-on Tasks</span>
            </div>
            <div className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl shadow-lg">
              <span className="text-gray-400 uppercase text-[10px] block">Protocols & Ports</span>
              <span className="text-xl font-bold text-yellow-400">30+ Services</span>
              <span className="text-[11px] text-gray-400 block mt-1">Full RFC Headers</span>
            </div>
            <div className="p-4 bg-[#12151c] border border-[#242a38] rounded-xl shadow-lg">
              <span className="text-gray-400 uppercase text-[10px] block">Career Paths</span>
              <span className="text-xl font-bold text-green-400">7 Roles</span>
              <span className="text-[11px] text-gray-400 block mt-1">SOC, VAPT, DFIR</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-8">
          <ProgressBar />
        </div>
      </section>

      {/* Interactive Enterprise Topology Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Interactive Enterprise Network Twin
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Click any node in the live digital twin to inspect its layer, protocols, common attacks, and defense controls.
            </p>
          </div>
          <button
            onClick={() => navigate('/simulator')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-red-400 hover:underline font-bold"
          >
            <span>Full Simulator Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <VisualTopology onSelectNode={(node) => console.log('Selected node:', node.name)} />
      </section>

      {/* 23-Phase Progression Preview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Complete 23-Phase Training Progression
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              From absolute mental models to multi-stage enterprise attack reconstruction.
            </p>
          </div>
          <button
            onClick={() => navigate('/roadmap')}
            className="text-xs font-mono text-red-400 hover:underline font-bold"
          >
            View Interactive Roadmap ?
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PHASES.slice(0, 6).map((phase) => (
            <div
              key={phase.id}
              onClick={() => navigate('/module/' + phase.id)}
              className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/50 hover:bg-[#181c26] transition cursor-pointer shadow-lg group"
            >
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-[#1f2533] text-gray-300 border border-[#2e374a] font-bold">
                  Phase {phase.phaseNumber < 10 ? '0' + phase.phaseNumber : phase.phaseNumber}
                </span>
                <span className="text-red-400 group-hover:translate-x-1 transition font-bold">Explore ?</span>
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-red-400 transition mb-1">
                {phase.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
                {phase.subtitle}
              </p>
              <div className="pt-3 border-t border-[#1e2430] flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span>{phase.topics.length} Topics</span>
                <span className="text-cyan-400">{phase.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Based Pathways Showcase */}
      <section className="p-6 sm:p-8 bg-[#12151c] border border-[#242a38] rounded-2xl">
        <div className="max-w-2xl mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Targeted Cybersecurity Career Pathways
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Choose your target professional cybersecurity discipline to generate a customized curriculum path.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.slice(0, 4).map((role) => (
            <div
              key={role.id}
              onClick={() => navigate('/role/' + role.id)}
              className="p-4 bg-[#151922] border border-[#242a38] rounded-xl hover:border-red-500/40 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-yellow-400">{role.code}</span>
                  <Award className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1 group-hover:text-red-400 transition">
                  {role.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                  {role.shortDesc}
                </p>
              </div>
              <span className="text-[11px] font-mono text-red-400 font-semibold group-hover:underline">
                View Roadmap ?
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
`;

const learnPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { ProgressBar } from '../components/common/ProgressBar';
import { BookOpen, CheckCircle2, ChevronRight, Terminal, Award } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const LearnPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { progress } = useProgress();

  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Complete Networking to Cybersecurity Curriculum
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Master 23 comprehensive phases with interactive theory, visual simulation engines, packet dissection, and knowledge checks.
        </p>
      </div>

      <ProgressBar />

      <div className="space-y-4">
        {PHASES.map((phase) => {
          const completedInPhase = phase.topics.filter((t) => progress.completedTopics.includes(t.id)).length;
          const isAllDone = completedInPhase === phase.topics.length && phase.topics.length > 0;

          return (
            <div
              key={phase.id}
              className="p-5 sm:p-6 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/40 transition shadow-lg"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#1e2430]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                      Phase {phase.phaseNumber < 10 ? '0' + phase.phaseNumber : phase.phaseNumber}
                    </span>
                    <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[#1f2533] text-gray-400">
                      {phase.category}
                    </span>
                    {isAllDone && (
                      <span className="flex items-center gap-1 text-xs font-mono text-green-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{phase.title}</h2>
                  <p className="text-xs text-gray-400">{phase.subtitle}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/module/' + phase.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                  >
                    Open Phase Deep Dive
                  </button>
                  {phase.featuredLabId && (
                    <button
                      onClick={() => navigate('/lab/' + phase.featuredLabId)}
                      className="px-4 py-2 rounded-lg bg-[#181c26] hover:bg-[#202533] border border-[#242a38] text-gray-300 text-xs font-mono font-semibold transition"
                    >
                      Featured Lab
                    </button>
                  )}
                </div>
              </div>

              {/* Topics inside phase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phase.topics.map((t) => {
                  const done = progress.completedTopics.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => navigate('/topic/' + t.id)}
                      className={\`p-3.5 rounded-lg border text-left transition flex items-center justify-between \${
                        done
                          ? 'bg-green-500/10 border-green-500/30 text-green-200'
                          : 'bg-[#151922] border-[#242a38] text-gray-300 hover:border-gray-500'
                      }\`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white mb-0.5">{t.title}</div>
                        <div className="text-[11px] text-gray-400">{t.estimatedMinutes} min · {t.difficulty}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

const roadmapPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { CheckCircle2, ArrowRight, BookOpen, Terminal, Shield } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const RoadmapPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { progress } = useProgress();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Visual 23-Phase Learning Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          The complete master progression from basic packet transmission through full SOC threat investigation.
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-[#242a38] space-y-8">
        {PHASES.map((phase) => {
          const completedCount = phase.topics.filter((t) => progress.completedTopics.includes(t.id)).length;
          const isDone = completedCount === phase.topics.length && phase.topics.length > 0;

          return (
            <div key={phase.id} className="relative group">
              {/* Dot */}
              <div className={\`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 transition \${
                isDone
                  ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/40'
                  : 'bg-[#151922] border-[#242a38] group-hover:border-red-500'
              }\`} />

              <div
                onClick={() => navigate('/module/' + phase.id)}
                className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/40 cursor-pointer transition shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-red-400">
                    PHASE {phase.phaseNumber < 10 ? '0' + phase.phaseNumber : phase.phaseNumber} · {phase.category}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {completedCount}/{phase.topics.length} Topics Completed
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-1">{phase.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{phase.subtitle}</p>
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold">
                  <span>Explore Phase Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

const modulesPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { BookOpen, Layers, ArrowRight } from 'lucide-react';

export const ModulesPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">All Training Modules</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Catalog of all 23 core networking to cybersecurity modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PHASES.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate('/module/' + p.id)}
            className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl hover:border-red-500/40 cursor-pointer transition shadow-lg group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-2 font-mono text-xs text-gray-400">
                <span>Phase {p.phaseNumber < 10 ? '0' + p.phaseNumber : p.phaseNumber}</span>
                <span className="text-red-400 font-bold">{p.category}</span>
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-red-400 transition mb-1">{p.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-4">{p.description}</p>
            </div>
            <div className="pt-3 border-t border-[#1e2430] flex items-center justify-between text-xs font-mono text-gray-400">
              <span>{p.topics.length} Topics</span>
              <span className="text-red-400 font-bold group-hover:translate-x-1 transition">Open Module ?</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
`;

const moduleDetailPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { ArrowLeft, BookOpen, Terminal, CheckCircle2, Shield, AlertTriangle, Play } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const ModuleDetailPage: React.FC<{ moduleId: string; navigate: (route: string) => void }> = ({ moduleId, navigate }) => {
  const { progress } = useProgress();
  const phase = PHASES.find((p) => p.id === moduleId) || PHASES[0];

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <button
        onClick={() => navigate('/learn')}
        className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Phases</span>
      </button>

      {/* Header */}
      <div className="p-6 sm:p-8 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
            Phase {phase.phaseNumber < 10 ? '0' + phase.phaseNumber : phase.phaseNumber}
          </span>
          <span className="px-2 py-1 rounded bg-[#1f2533] text-gray-400 uppercase">
            {phase.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{phase.title}</h1>
        <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">{phase.description}</p>

        {/* Security Mapping Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#1e2430] text-xs">
          <div className="p-3 bg-[#151922] border border-[#242a38] rounded-lg">
            <span className="font-mono uppercase text-red-400 font-bold block mb-1">Attack Surface:</span>
            <p className="text-gray-300">{phase.securityMapping.attackSurface}</p>
          </div>
          <div className="p-3 bg-[#151922] border border-[#242a38] rounded-lg">
            <span className="font-mono uppercase text-green-400 font-bold block mb-1">Defense Control:</span>
            <p className="text-gray-300">{phase.securityMapping.defenseStrategy}</p>
          </div>
        </div>
      </div>

      {/* Topics in this Module */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white">Module Topics & Deep Concepts</h2>
        <div className="space-y-4">
          {phase.topics.map((topic) => (
            <div
              key={topic.id}
              className="p-5 bg-[#12151c] border border-[#242a38] rounded-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-white">{topic.title}</h3>
                  <span className="text-xs text-gray-400 font-mono">{topic.estimatedMinutes} mins · {topic.difficulty}</span>
                </div>
                <button
                  onClick={() => navigate('/topic/' + topic.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                >
                  Start Topic Lab
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{topic.summary}</p>

              {/* Key takeaways */}
              <div className="space-y-2 pt-2 border-t border-[#1e2430]">
                {topic.concepts.map((c) => (
                  <div key={c.id} className="p-3 bg-[#151922] rounded-lg text-xs space-y-1">
                    <span className="font-bold text-white block">{c.title}</span>
                    <p className="text-gray-300">{c.detailedContent}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

const topicDetailPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { KnowledgeCheck } from '../components/common/KnowledgeCheck';
import { ArrowLeft, BookOpen, Shield, Play, Terminal, CheckCircle2 } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';

export const TopicDetailPage: React.FC<{ topicId: string; navigate: (route: string) => void }> = ({ topicId, navigate }) => {
  const { progress } = useProgress();

  let foundTopic: any = null;
  let foundPhase: any = null;

  for (const p of PHASES) {
    const t = p.topics.find((top) => top.id === topicId);
    if (t) {
      foundTopic = t;
      foundPhase = p;
      break;
    }
  }

  if (!foundTopic) {
    foundTopic = PHASES[0].topics[0];
    foundPhase = PHASES[0];
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-8">
      <button
        onClick={() => navigate('/module/' + foundPhase.id)}
        className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to {foundPhase.title}</span>
      </button>

      {/* Header */}
      <div className="p-6 bg-[#12151c] border border-[#242a38] rounded-2xl shadow-xl space-y-2">
        <div className="flex items-center gap-2 font-mono text-xs text-red-400 font-bold">
          <span>{foundPhase.title}</span>
          <span>·</span>
          <span>{foundTopic.difficulty}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{foundTopic.title}</h1>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{foundTopic.summary}</p>
      </div>

      {/* Concept Breakdown Sections */}
      <div className="space-y-6">
        {foundTopic.concepts.map((concept: any) => (
          <div
            key={concept.id}
            className="p-6 bg-[#12151c] border border-[#242a38] rounded-xl space-y-4 shadow-lg"
          >
            <h3 className="text-base sm:text-lg font-bold text-white border-b border-[#242a38] pb-3">
              {concept.title}
            </h3>

            <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
              {concept.detailedContent}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2">
              <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
                <span className="font-mono uppercase text-red-400 font-bold block mb-1">Cybersecurity Impact:</span>
                <p className="text-gray-300">{concept.securityImpact}</p>
              </div>

              <div className="p-3.5 bg-[#151922] border border-[#242a38] rounded-lg">
                <span className="font-mono uppercase text-green-400 font-bold block mb-1">Defense & Mitigation:</span>
                <p className="text-gray-300">{concept.defenseControl}</p>
              </div>
            </div>

            {concept.keyTakeaways && (
              <div className="p-3.5 bg-[#0a0c10] border border-[#242a38] rounded-lg text-xs space-y-1">
                <span className="font-mono uppercase text-yellow-400 font-bold block mb-1">Key Takeaways:</span>
                <ul className="space-y-1 text-gray-300">
                  {concept.keyTakeaways.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Knowledge Check */}
      {foundTopic.knowledgeChecks && foundTopic.knowledgeChecks.length > 0 && (
        <div className="pt-4">
          <KnowledgeCheck
            question={foundTopic.knowledgeChecks[0]}
            topicId={foundTopic.id}
            onComplete={() => console.log('Topic knowledge mastered!')}
          />
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/pages/HomePage.tsx', homePageCode);
fs.writeFileSync('src/pages/LearnPage.tsx', learnPageCode);
fs.writeFileSync('src/pages/RoadmapPage.tsx', roadmapPageCode);
fs.writeFileSync('src/pages/ModulesPage.tsx', modulesPageCode);
fs.writeFileSync('src/pages/ModuleDetailPage.tsx', moduleDetailPageCode);
fs.writeFileSync('src/pages/TopicDetailPage.tsx', topicDetailPageCode);

console.log('Core pages generated successfully');
