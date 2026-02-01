import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExpressionStep from '@/components/assessment/ExpressionStep';
import FusionReport from '@/components/assessment/FusionReport';
import ScaleStep from '@/components/assessment/ScaleStep';
import StepNavigation, { AssessmentStep } from '@/components/assessment/StepNavigation';
import VoiceStep from '@/components/assessment/VoiceStep';
import { useAuth } from '@/contexts/AuthContext';

export default function EnhancedAssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('scale');
  const [completedSteps, setCompletedSteps] = useState<AssessmentStep[]>([]);
  const [scaleData, setScaleData] = useState<any>(null);
  const [voiceData, setVoiceData] = useState<any>(null);
  const [expressionData, setExpressionData] = useState<any>(null);

  const handleStepComplete = (step: AssessmentStep, data: any) => {
    setCompletedSteps(prev => [...new Set([...prev, step])]);
    
    if (step === 'scale') {
      setScaleData(data);
      setCurrentStep('voice');
    } else if (step === 'voice') {
      setVoiceData(data);
      setCurrentStep('expression');
    } else if (step === 'expression') {
      setExpressionData(data);
      setCurrentStep('report');
    }
  };

  const handleStepChange = (step: AssessmentStep) => {
    // 允许用户在已完成或当前步骤之间切换，或者强制按顺序？
    // 这里允许自由切换以便测试
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 顶部固定导航 */}
      {currentStep !== 'report' && (
        <StepNavigation 
          currentStep={currentStep} 
          onStepChange={handleStepChange}
          completedSteps={completedSteps}
        />
      )}

      {/* 步骤内容 */}
      <main className="relative h-full">
        <AnimatePresence mode="wait">
          {currentStep === 'scale' && (
            <motion.div
              key="scale"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ScaleStep 
                userId={user?.id || ''} 
                onComplete={(data) => handleStepComplete('scale', data)} 
              />
            </motion.div>
          )}

          {currentStep === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <VoiceStep 
                onComplete={(data) => handleStepComplete('voice', data)} 
              />
            </motion.div>
          )}

          {currentStep === 'expression' && (
            <motion.div
              key="expression"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ExpressionStep 
                onComplete={(data) => handleStepComplete('expression', data)} 
              />
            </motion.div>
          )}

          {currentStep === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <FusionReport 
                scaleData={scaleData}
                voiceData={voiceData}
                expressionData={expressionData}
                onClose={() => navigate('/')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
