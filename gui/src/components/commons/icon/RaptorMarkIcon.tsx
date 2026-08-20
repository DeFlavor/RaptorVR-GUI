export function RaptorMarkIcon({ drag }: { drag?: boolean }) {
  return (
    <img
      src="/images/raptorvr-mark.png"
      alt=""
      className="raptor-topbar-mark"
      data-electron-drag-region={drag}
    />
  );
}
