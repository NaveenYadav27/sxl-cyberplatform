const fs = require('fs');

const topicDetailPageCode = `import React from 'react';
import { PHASES } from '../data/curriculum';
import { KnowledgeCheck } from '../components/common/KnowledgeCheck';
import { ConceptVisualFlow } from '../components/common/ConceptVisualFlow';
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

      {/* Concept Breakdown Sections with Interactive Visual Flows */}
      <div className="space-y-8">
        {foundTopic.concepts.map((concept: any) => (
          <div
            key={concept.id}
            className="p-6 bg-[#12151c] border border-[#242a38] rounded-xl space-y-6 shadow-lg"
          >
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white border-b border-[#242a38] pb-3 mb-3">
                {concept.title}
              </h3>

              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {concept.detailedContent}
              </p>
            </div>

            {/* Embedded Visual Interactive Flow */}
            <div>
              <ConceptVisualFlow concept={concept} />
            </div>

            {/* Cybersecurity Impact & Defense Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans pt-2">
              <div className="p-4 bg-[#151922] border border-[#242a38] rounded-lg space-y-1">
                <span className="font-mono uppercase text-red-400 font-bold text-[11px] block">Cybersecurity Impact:</span>
                <p className="text-gray-300 leading-relaxed">{concept.securityImpact}</p>
              </div>

              <div className="p-4 bg-[#151922] border border-[#242a38] rounded-lg space-y-1">
                <span className="font-mono uppercase text-green-400 font-bold text-[11px] block">Defense & Mitigation:</span>
                <p className="text-gray-300 leading-relaxed">{concept.defenseControl}</p>
              </div>
            </div>

            {concept.keyTakeaways && (
              <div className="p-4 bg-[#0a0c10] border border-[#242a38] rounded-lg text-xs space-y-2">
                <span className="font-mono uppercase text-yellow-400 font-bold text-[11px] block">Key Takeaways:</span>
                <ul className="space-y-1.5 text-gray-300">
                  {concept.keyTakeaways.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">?</span>
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

fs.writeFileSync('src/pages/TopicDetailPage.tsx', topicDetailPageCode);
console.log('TopicDetailPage.tsx updated with interactive visual flows');
