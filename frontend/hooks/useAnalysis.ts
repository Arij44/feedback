import { useState } from 'react';

export function useAnalysis() {
  const steps = [
    '🔌 Connecting to server...',
    '🔍 Fetching post data...',
    '💡 Analyzing sentiment...',
    '💬 Extracting comment insights...',
    '✨​ Clustering topics...',
    '⚡​ Summarizing results...',
    '⬇️​ Finalizing report...'
  ];

  const waitingSteps = [
    '⏳ Still processing...',
    '⏳ Syncing data...',
    '⏳ Running final checks...',
    '⏳ Almost there...'
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);

  async function runAnalysis<T>(backendCallback: () => Promise<T>): Promise<T | null> {
    setRunning(true);
    setStepIndex(0);

    let backendDone = false;
    let result: T | null = null;

    // Start backend call in parallel
    const backendPromise = backendCallback().then((res) => {
      backendDone = true;
      return res;
    }).catch((err) => {
      console.error("❌ Analysis error:", err);
      backendDone = true;
      return null;
    });

    // Step through main analysis steps
    for (let i = 0; i < steps.length; i++) {
      setStepIndex(i);
      await new Promise((r) => setTimeout(r, 2000));
    }

    // While backend still running, loop over waitingSteps
    let waitIndex = 0;
    while (!backendDone) {
      setStepIndex(steps.length + waitIndex % waitingSteps.length);
      await new Promise((r) => setTimeout(r, 1500));
      waitIndex++;
    }

    result = await backendPromise;
    setRunning(false);
    return result;
  }

  const allSteps = [...steps, ...waitingSteps];

  return { steps: allSteps, stepIndex, running, runAnalysis };
}
