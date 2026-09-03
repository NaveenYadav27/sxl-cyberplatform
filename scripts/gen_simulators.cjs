const fs = require('fs');

const progressBarCode = `import React from 'react';
import { useProgress } from '../../context/ProgressContext';
import { Award, Zap, CheckCircle2, Flame } from 'lucide-react';
import { PHASES } from '../../data/curriculum';

export const ProgressBar: React.FC = () => {
  const { progress } = useProgress();

  const totalTopics = PHASES.reduce((acc, p) => acc + p.topics.length, 0);
  const completedCount = progress.completedTopics.length;
  const pct = Math.min(100, Math.round((completedCount / totalTopics) * 100));

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
            Training Progression
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-sm font-bold text-white">Curriculum Completion</h3>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
              {pct}% Mastered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#181c26] border border-[#242a38] px-2.5 py-1 rounded-lg">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300">Level</span>
            <span className="font-bold text-yellow-400">{progress.level}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181c26] border border-[#242a38] px-2.5 py-1 rounded-lg">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-cyan-400">{progress.xp}</span>
            <span className="text-gray-400">XP</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#181c26] border border-[#242a38] px-2.5 py-1 rounded-lg">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-orange-400">{progress.streakDays}d</span>
            <span className="text-gray-400">Streak</span>
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full bg-[#181c26] h-2.5 rounded-full overflow-hidden border border-[#242a38]">
        <div
          className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 h-full transition-all duration-500 rounded-full"
          style={{ width: \`\${Math.max(4, pct)}%\` }}
        />
      </div>

      {/* Sub Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#1c222e] text-[11px] font-mono">
        <div>
          <span className="text-gray-400">Topics Done: </span>
          <span className="text-white font-bold">{completedCount} / {totalTopics}</span>
        </div>
        <div>
          <span className="text-gray-400">Labs Completed: </span>
          <span className="text-green-400 font-bold">{progress.completedLabs.length}</span>
        </div>
        <div>
          <span className="text-gray-400">Missions: </span>
          <span className="text-cyan-400 font-bold">{progress.completedMissions.length}</span>
        </div>
        <div>
          <span className="text-gray-400">Status: </span>
          <span className="text-yellow-400 font-bold">{pct === 100 ? 'Certified' : 'In Training'}</span>
        </div>
      </div>
    </div>
  );
};
`;

const knowledgeCheckCode = `import React, { useState } from 'react';
import { KnowledgeCheckQuestion } from '../../types';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';

interface KnowledgeCheckProps {
  question: KnowledgeCheckQuestion;
  topicId: string;
  onComplete?: () => void;
}

export const KnowledgeCheck: React.FC<KnowledgeCheckProps> = ({ question, topicId, onComplete }) => {
  const { recordQuizScore, completeTopic } = useProgress();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedIdx === null) return;
    setSubmitted(true);
    const isCorrect = selectedIdx === question.correctIndex;
    recordQuizScore(topicId, isCorrect ? 100 : 0);
    if (isCorrect) {
      completeTopic(topicId);
      if (onComplete) onComplete();
    }
  };

  const isCorrect = submitted && selectedIdx === question.correctIndex;

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-wider text-red-400">
        <HelpCircle className="w-4 h-4 text-red-500" />
        <span>Knowledge Check · {question.securityContext}</span>
      </div>

      <h4 className="text-sm sm:text-base font-bold text-white mb-4 leading-relaxed">
        {question.question}
      </h4>

      <div className="space-y-2.5 mb-5">
        {question.options.map((opt, idx) => {
          let stateStyle = 'bg-[#181c26] border-[#242a38] text-gray-300 hover:border-red-500/40';

          if (submitted) {
            if (idx === question.correctIndex) {
              stateStyle = 'bg-green-500/15 border-green-500/50 text-green-300 font-semibold';
            } else if (idx === selectedIdx) {
              stateStyle = 'bg-red-500/15 border-red-500/50 text-red-300';
            } else {
              stateStyle = 'bg-[#151922] border-[#242a38] text-gray-400 opacity-60';
            }
          } else if (selectedIdx === idx) {
            stateStyle = 'bg-red-500/15 border-red-500 text-white font-medium';
          }

          return (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelectedIdx(idx)}
              className={\`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm transition flex items-center justify-between gap-3 \${stateStyle}\`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-400 w-5 flex-shrink-0">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span>{opt}</span>
              </div>
              {submitted && idx === question.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              )}
              {submitted && idx === selectedIdx && idx !== question.correctIndex && (
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={selectedIdx === null}
          className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/20 flex items-center gap-2"
        >
          <span>Submit Answer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className={\`p-4 rounded-lg border text-xs leading-relaxed animate-in fade-in duration-200 \${
          isCorrect
            ? 'bg-green-500/10 border-green-500/30 text-green-200'
            : 'bg-red-500/10 border-red-500/30 text-red-200'
        }\`}>
          <div className="flex items-center gap-2 font-bold mb-1 font-mono uppercase">
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Correct! Knowledge Mastered (+50 XP)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Incorrect Answer</span>
              </>
            )}
          </div>
          <p className="text-gray-300 mt-1">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
`;

const commandTerminalCode = `import React, { useState } from 'react';
import { COMMANDS } from '../../data/commands';
import { Terminal, Play, Info, Shield, Check } from 'lucide-react';

export const CommandTerminal: React.FC = () => {
  const [selectedCmd, setSelectedCmd] = useState(COMMANDS[0]);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState(COMMANDS[0].simulatedOutput);
  const [executing, setExecuting] = useState(false);

  const handleSelect = (cmd: typeof COMMANDS[0]) => {
    setSelectedCmd(cmd);
    setCustomInput(cmd.command);
    setOutput(cmd.simulatedOutput);
  };

  const handleExecute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setExecuting(true);
    setTimeout(() => {
      setOutput(selectedCmd.simulatedOutput);
      setExecuting(false);
    }, 250);
  };

  return (
    <div className="bg-[#12151c] border border-[#242a38] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="p-3 bg-[#151922] border-b border-[#242a38] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="text-xs font-mono text-gray-400 ml-2">
            root@shadowxlab-sim-node:~#
          </span>
        </div>

        {/* Command Quick Select Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {COMMANDS.map((c) => (
            <button
              key={c.command}
              onClick={() => handleSelect(c)}
              className={\`px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap \${
                selectedCmd.command === c.command
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold'
                  : 'bg-[#181c26] text-gray-400 hover:text-white border border-[#242a38]'
              }\`}
            >
              {c.command}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-4 sm:p-5 bg-[#090b0f] font-mono text-xs text-gray-300 min-h-[220px] max-h-[380px] overflow-y-auto">
        <div className="text-green-400 mb-2 flex items-center gap-2">
          <span>root@shadowxlab-sim-node:~#</span>
          <span className="text-white font-bold">{selectedCmd.command}</span>
        </div>

        {executing ? (
          <div className="text-yellow-400 animate-pulse py-4">
            Executing simulated socket call...
          </div>
        ) : (
          <pre className="text-gray-300 whitespace-pre-wrap leading-relaxed">
            {output}
          </pre>
        )}
      </div>

      {/* Educational Analysis Drawer */}
      <div className="p-4 sm:p-5 bg-[#12151c] border-t border-[#242a38] text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-red-400 font-bold font-mono mb-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>What to Look For</span>
            </div>
            <ul className="space-y-1 text-gray-300">
              {selectedCmd.whatToLookFor.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono mb-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Cybersecurity Relevance</span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              {selectedCmd.securityRelevance}
            </p>
          </div>
        </div>

        {/* Flags list */}
        <div className="pt-3 border-t border-[#1e2430]">
          <span className="text-gray-400 font-mono text-[11px] uppercase font-bold block mb-1.5">
            Essential CLI Flags:
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedCmd.flags.map((f, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded bg-[#181c26] border border-[#242a38] text-[11px] font-mono text-gray-300"
              >
                <strong className="text-yellow-400">{f.flag}</strong> : {f.description}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/common/ProgressBar.tsx', progressBarCode);
fs.writeFileSync('src/components/common/KnowledgeCheck.tsx', knowledgeCheckCode);
fs.writeFileSync('src/components/common/CommandTerminal.tsx', commandTerminalCode);

console.log('Common components generated successfully');
