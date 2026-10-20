import { useLocalization } from '@fluent/react';
import { useOnboarding } from '@/hooks/onboarding';
import { Button } from '@/components/commons/Button';
import { LangSelector } from '@/components/commons/LangSelector';
import { Typography } from '@/components/commons/Typography';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const nav = useNavigate();
  const { l10n } = useLocalization();
  const { applyProgress, onboardingStarted } = useOnboarding();

  applyProgress(0.1);

  const start = () => {
    onboardingStarted();
    nav('/onboarding/quiz/slime-set');
  };

  return (
    <>
      <div className="flex relative flex-col gap-5 h-full items-center w-full justify-center px-4 overflow-clip">
        <div className="raptor-onboarding-panel flex flex-col gap-5 items-center z-10 mb-10">
          <img
            src="/images/raptorvr-logo.png"
            alt="Raptor VR GUI"
            className="raptor-onboarding-logo"
          />
          <Typography variant="mobile-title">
            {l10n.getString('onboarding-home')}
          </Typography>
          <Button variant="primary" onClick={start}>
            {l10n.getString('onboarding-home-start')}
          </Button>
        </div>
        <div className="absolute right-4 bottom-4 z-50">
          <LangSelector />
        </div>
      </div>
    </>
  );
}
