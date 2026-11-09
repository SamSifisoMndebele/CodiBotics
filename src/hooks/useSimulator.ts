import { useState, useCallback } from 'react';
import { GradePhase } from '../types/simulator';

export interface SimulatorStatus {
  phase: GradePhase;
  isExecuting: boolean;
  stepCount: number;
}

export function useSimulator(initialPhase: GradePhase = 'foundation') {
  const [phase, setPhase] = useState<GradePhase>(initialPhase);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);

  const startExecution = useCallback(() => {
    setIsExecuting(true);
    setStepCount(0);
  }, []);

  const stopExecution = useCallback(() => {
    setIsExecuting(false);
  }, []);

  const incrementStep = useCallback(() => {
    setStepCount((c) => c + 1);
  }, []);

  return {
    phase,
    setPhase,
    isExecuting,
    stepCount,
    startExecution,
    stopExecution,
    incrementStep,
  };
}
