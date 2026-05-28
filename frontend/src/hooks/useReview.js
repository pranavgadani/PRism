import { useState, useCallback } from 'react';

const initialStepState = () => ({
  label: '',
  content: '',
  streaming: false,
  done: false,
});

export const useReview = (socket) => {
  const [steps, setSteps] = useState({
    1: initialStepState(),
    2: initialStepState(),
    3: initialStepState(),
    4: initialStepState(),
  });
  const [activeStep, setActiveStep] = useState(null);
  const [prInfo, setPrInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const resetReview = useCallback(() => {
    setSteps({ 1: initialStepState(), 2: initialStepState(), 3: initialStepState(), 4: initialStepState() });
    setActiveStep(null);
    setPrInfo(null);
    setResult(null);
    setError(null);
    setIsReviewing(false);
  }, []);

  const startReview = useCallback(({ owner, repo, pull_number }) => {
    if (!socket) return;
    resetReview();
    setIsReviewing(true);

    socket.on('review:pr_info', (data) => setPrInfo(data));

    socket.on('review:step', ({ step, label }) => {
      setActiveStep(step);
      setSteps((prev) => ({
        ...prev,
        [step]: { label, content: '', streaming: true, done: false },
      }));
    });

    socket.on('review:token', ({ step, token }) => {
      setSteps((prev) => ({
        ...prev,
        [step]: { ...prev[step], content: (prev[step]?.content || '') + token },
      }));
    });

    socket.on('review:step_done', ({ step, content }) => {
      setSteps((prev) => ({
        ...prev,
        [step]: { ...prev[step], content, streaming: false, done: true },
      }));
    });

    socket.on('review:complete', (data) => {
      setResult(data);
      setIsReviewing(false);
      setActiveStep(null);
    });

    socket.on('review:error', ({ message }) => {
      setError(message);
      setIsReviewing(false);
    });

    socket.emit('review:start', { owner, repo, pull_number });
  }, [socket, resetReview]);

  return { steps, activeStep, prInfo, result, error, isReviewing, startReview, resetReview };
};
