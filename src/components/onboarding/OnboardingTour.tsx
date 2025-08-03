import { useState, useCallback, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
}

const TOUR_STORAGE_KEY = '360brief-onboarding-tour-completed';

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const { setShowExampleData } = useUserPreferences();

  // Check if tour was already completed
  useEffect(() => {
    const wasTourCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    if (!wasTourCompleted && run) {
      setIsRunning(true);
      setShowExampleData(true); // Ensure example data is shown during tour
    }
  }, [run, setShowExampleData]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status)) {
        setIsRunning(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        onComplete();
      }
    },
    [onComplete]
  );

  const steps: Step[] = [
    {
      target: '.dashboard-header',
      content: 'Welcome to your 360° Executive Brief! This dashboard gives you a complete overview of your priorities.',
      disableBeacon: true,
      placement: 'center' as const,
    },
    {
      target: '.stats-cards',
      content: 'Quick stats show your email volume, meeting time, and task completion at a glance.',
      placement: 'bottom' as const,
    },
    {
      target: '.email-activity-chart',
      content: 'Track your email patterns and identify busy times to optimize your schedule.',
      placement: 'top' as const,
    },
    {
      target: '.priority-matrix',
      content: 'The Priority Matrix helps you focus on what matters most. Urgent & important items appear in the top right.',
      placement: 'left' as const,
    },
    {
      target: '.upcoming-meetings',
      content: 'Your upcoming meetings are listed here. Click any meeting to see details.',
      placement: 'top' as const,
    },
    {
      target: '.recent-activity',
      content: 'Recent activity keeps you updated on important changes and updates.',
      placement: 'top' as const,
    },
    {
      target: '.top-contacts',
      content: 'Your most frequent contacts appear here for quick access.',
      placement: 'left' as const,
    },
    {
      target: '.data-toggle',
      content: 'Toggle between your real data and example data anytime to explore features.',
      placement: 'left' as const,
    },
    {
      target: '.dashboard-header',
      content: 'You\'re all set! Start exploring your executive brief. Use the help button if you need a refresher.',
      placement: 'center' as const,
    },
  ];

  if (!isRunning) return null;

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      callback={handleJoyrideCallback}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          fontSize: '0.9rem',
          padding: '1.5rem',
          borderRadius: '0.5rem',
        },
        buttonNext: {
          backgroundColor: '#4f46e5',
          color: 'white',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
        },
        buttonBack: {
          color: '#4f46e5',
          marginRight: '0.5rem',
        },
      }}
    />
  );
};
