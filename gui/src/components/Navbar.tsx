import { useLocalization } from '@fluent/react';
import classnames from 'classnames';
import { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { GearIcon } from './commons/icon/GearIcon';
import { HumanIcon } from './commons/icon/HumanIcon';
import { RulerIcon } from './commons/icon/RulerIcon';
import { useBreakpoint } from '@/hooks/breakpoint';
import { HomeIcon } from './commons/icon/HomeIcon';
import { SkiIcon } from './commons/icon/SkiIcon';
import { WifiIcon } from './commons/icon/WifiIcon';

export function NavButton({
  to,
  children,
  match,
  state = {},
  icon,
}: {
  to: string;
  children: ReactNode;
  match?: string;
  state?: any;
  icon: ReactNode;
}) {
  const doesMatch = useMatch({
    path: match || to,
  });

  return (
    <NavLink
      to={to}
      state={state}
      className={classnames(
        'raptor-nav-button flex xs:flex-row mobile:flex-col items-center xs:gap-3 mobile:gap-2',
        'mobile:w-[65px] mobile:h-[65px]',
        'xs:px-3 xs:py-3 mobile:py-4 group select-text',
        {
          'is-active fill-accent-background-20': doesMatch,
          'fill-background-40': !doesMatch,
        }
      )}
    >
      <div className="raptor-nav-button__icon flex justify-around">
        <div
          className={classnames('scale-[135%]', {
            'fill-accent-lighter': doesMatch,
            'fill-background-40': !doesMatch,
          })}
        >
          {icon}
        </div>
      </div>
      <div
        className={classnames(
          'raptor-nav-button__label text-left mobile:hidden',
          {
            'text-accent-background-10': doesMatch,
            'text-background-10': !doesMatch,
          }
        )}
      >
        {children}
      </div>
    </NavLink>
  );
}

export function MainLinks() {
  const { l10n } = useLocalization();

  return (
    <>
      <NavButton to="/" icon={<HomeIcon />}>
        {l10n.getString('navbar-home')}
      </NavButton>
      <NavButton
        to="/onboarding/trackers-assign"
        state={{ alonePage: true }}
        icon={<HumanIcon />}
      >
        {l10n.getString('navbar-trackers_assign')}
      </NavButton>
      <NavButton
        to="/onboarding/mounting/choose"
        match="/onboarding/mounting/*"
        state={{ alonePage: true }}
        icon={<SkiIcon />}
      >
        {l10n.getString('navbar-mounting')}
      </NavButton>
      <NavButton
        to="/onboarding/body-proportions/scaled"
        match="/onboarding/body-proportions/*"
        state={{ alonePage: true }}
        icon={<RulerIcon />}
      >
        {l10n.getString('navbar-body_proportions')}
      </NavButton>
      <NavButton
        to="/onboarding/wifi-creds"
        icon={<WifiIcon value={1} disabled variant="navbar" />}
        state={{ alonePage: true }}
      >
        {l10n.getString('navbar-connect_trackers')}
      </NavButton>
    </>
  );
}

export function Navbar() {
  const { isMobile } = useBreakpoint('mobile');
  const { l10n } = useLocalization();

  return isMobile ? (
    <div className="raptor-navbar-mobile flex flex-row justify-around px-2 pt-2 gap-2">
      <MainLinks />
    </div>
  ) : (
    <aside className="raptor-navbar flex flex-col h-full p-3 gap-2">
      <div className="raptor-navbar__label">CONTROL DECK</div>
      <div className="flex flex-col flex-grow gap-2">
        <MainLinks />
      </div>
      <NavButton
        to="/settings/trackers"
        match="/settings/*"
        state={{ scrollTo: 'steamvr' }}
        icon={<GearIcon />}
      >
        {l10n.getString('navbar-settings')}
      </NavButton>
    </aside>
  );
}
