export enum SlimeState {
  HAPPY,
  SAD,
  JUMPY,
  CURIOUS,
}

export function LoaderIcon({
  slimeState = SlimeState.HAPPY,
  size = 85,
}: {
  slimeState: SlimeState;
  size?: number | string;
}) {
  const stateName = {
    [SlimeState.HAPPY]: 'ready',
    [SlimeState.SAD]: 'alert',
    [SlimeState.JUMPY]: 'active',
    [SlimeState.CURIOUS]: 'searching',
  }[slimeState];

  return (
    <div
      className={`raptor-signal raptor-signal--${stateName}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Raptor VR ${stateName} signal`}
    >
      <img src="/images/raptorvr-mark.png" alt="" aria-hidden="true" />
    </div>
  );
}
