const fs = require('fs');

const progressContextCode = `import React, { createContext, useContext, useState, useEffect } from 'react';
import { LearnerProgress } from '../types';

interface ProgressContextType {
  progress: LearnerProgress;
  completeTopic: (topicId: string) => void;
  completeLab: (labId: string, score?: number) => void;
  completeMission: (missionId: string) => void;
  selectRole: (roleId: string) => void;
  recordQuizScore: (topicId: string, score: number) => void;
  resetProgress: () => void;
  exportProgress: () => string;
  importProgress: (json: string) => boolean;
}

const DEFAULT_PROGRESS: LearnerProgress = {
  completedTopics: [],
  completedLabs: [],
  masteredSkills: ['Network Mental Model'],
  completedMissions: [],
  quizScores: {},
  selectedRoleId: 'role-soc-l1',
  xp: 150,
  level: 1,
  streakDays: 3,
  lastActive: new Date().toISOString()
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<LearnerProgress>(() => {
    try {
      const saved = localStorage.getItem('shadowxlab-progress');
      return saved ? JSON.parse(saved) : DEFAULT_PROGRESS;
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shadowxlab-progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }, [progress]);

  const addXp = (amount: number, currentProgress: LearnerProgress) => {
    const newXp = currentProgress.xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    return { xp: newXp, level: newLevel };
  };

  const completeTopic = (topicId: string) => {
    setProgress((prev) => {
      if (prev.completedTopics.includes(topicId)) return prev;
      const { xp, level } = addXp(50, prev);
      return {
        ...prev,
        completedTopics: [...prev.completedTopics, topicId],
        xp,
        level,
        lastActive: new Date().toISOString()
      };
    });
  };

  const completeLab = (labId: string, score: number = 100) => {
    setProgress((prev) => {
      if (prev.completedLabs.includes(labId)) return prev;
      const { xp, level } = addXp(100, prev);
      return {
        ...prev,
        completedLabs: [...prev.completedLabs, labId],
        quizScores: { ...prev.quizScores, [labId]: score },
        xp,
        level,
        lastActive: new Date().toISOString()
      };
    });
  };

  const completeMission = (missionId: string) => {
    setProgress((prev) => {
      if (prev.completedMissions.includes(missionId)) return prev;
      const { xp, level } = addXp(75, prev);
      return {
        ...prev,
        completedMissions: [...prev.completedMissions, missionId],
        xp,
        level,
        lastActive: new Date().toISOString()
      };
    });
  };

  const selectRole = (roleId: string) => {
    setProgress((prev) => ({ ...prev, selectedRoleId: roleId }));
  };

  const recordQuizScore = (topicId: string, score: number) => {
    setProgress((prev) => ({
      ...prev,
      quizScores: { ...prev.quizScores, [topicId]: score }
    }));
  };

  const resetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
  };

  const exportProgress = () => {
    return JSON.stringify(progress, null, 2);
  };

  const importProgress = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (parsed && Array.isArray(parsed.completedTopics)) {
        setProgress(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        completeTopic,
        completeLab,
        completeMission,
        selectRole,
        recordQuizScore,
        resetProgress,
        exportProgress,
        importProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
`;

const themeContextCode = `import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('shadowxlab-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('shadowxlab-theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
`;

fs.writeFileSync('src/context/ProgressContext.tsx', progressContextCode);
fs.writeFileSync('src/context/ThemeContext.tsx', themeContextCode);

console.log('src/context/ files generated successfully');
