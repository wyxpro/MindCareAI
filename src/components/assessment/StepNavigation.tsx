import React from 'react';
import { motion } from 'framer-motion';
import { Check, ClipboardList, Mic, Video } from 'lucide-react';

export type AssessmentStep = 'scale' | 'voice' | 'expression' | 'report';

interface StepNavigationProps {
  currentStep: AssessmentStep;
  onStepChange: (step: AssessmentStep) => void;
  completedSteps: AssessmentStep[];
}

const steps: { id: AssessmentStep; label: string; icon: any }[] = [
  { id: 'scale', label: '量表评估', icon: ClipboardList },
  { id: 'voice', label: '语音识别', icon: Mic },
  { id: 'expression', label: '表情识别', icon: Video },
];

export default function StepNavigation({ currentStep, onStepChange, completedSteps }: StepNavigationProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* 背景连接线 */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 -z-10 mx-6" />
        
        {/* 进度连接线 */}
        <motion.div 
          initial={false}
          animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 mx-6 origin-left"
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isPast = steps.findIndex(s => s.id === currentStep) > index;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onStepChange(step.id)}
                className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                    isCompleted || isPast ? 'bg-primary/10 text-primary border-2 border-primary' : 
                    'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-100 dark:border-slate-700'}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                
                {/* 活跃指示器 */}
                {isActive && (
                  <motion.div
                    layoutId="active-step"
                    className="absolute -inset-1 rounded-full border-2 border-primary animate-pulse"
                  />
                )}
              </motion.button>
              <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
