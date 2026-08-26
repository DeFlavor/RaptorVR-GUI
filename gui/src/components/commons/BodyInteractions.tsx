import classNames from 'classnames';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BodyPart } from 'solarxr-protocol';
import { PersonFrontIcon } from './PersonFrontIcon';
import { useBreakpoint } from '@/hooks/breakpoint';

function getOffset(el: Element, offset = { left: 0, top: 0 }) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - (offset.left || 0),
    top: rect.top - (offset.top || 0),
    width: rect.width || (el as HTMLElement).offsetWidth,
    height: rect.height || (el as HTMLElement).offsetHeight,
  };
}

export function BodyInteractions({
  leftControls,
  rightControls,
  highlightedRoles,
  assignedRoles,
  dotsSize = 15,
  variant = 'tracker-select',
  mirror,
  onSelectRole,
}: {
  leftControls?: ReactNode;
  rightControls?: ReactNode;
  width?: number;
  dotsSize?: number;
  variant?: 'dots' | 'tracker-select';
  assignedRoles: BodyPart[];
  onSelectRole: (role: BodyPart) => void;
  highlightedRoles: BodyPart[];
  mirror: boolean;
}) {
  const { isMobile } = useBreakpoint('mobile');

  const personRef = useRef<HTMLDivElement | null>(null);
  const leftContainerRef = useRef<HTMLDivElement | null>(null);
  const rightContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefRef = useRef<HTMLCanvasElement | null>(null);
  const [slotsButtonsPos, setSlotsButtonPos] = useState<
    {
      id: string;
      left: number;
      top: number;
      height: number;
      width: number;
      hidden: boolean;
      rotation: number;
      buttonOffset: {
        left: number;
        top: number;
      };
    }[]
  >([]);

  const updateSlots = useCallback(() => {
    if (
      !(
        personRef.current &&
        canvasRefRef.current &&
        rightContainerRef.current &&
        leftContainerRef.current
      )
    )
      return;
    const ctx = canvasRefRef.current.getContext('2d');
    if (!ctx) return;
    const slotsPos = [
      ...personRef.current.querySelectorAll<SVGCircleElement>(
        '.body-part-circle'
      ),
    ];
    const getControls = (container: HTMLDivElement) =>
      [...container.querySelectorAll<HTMLElement>('.control')].filter(
        ({ id }) => !!id
      );
    const controlsPos = [
      ...getControls(leftContainerRef.current),
      ...getControls(rightContainerRef.current),
    ];

    canvasRefRef.current.width = canvasRefRef.current.clientWidth;
    canvasRefRef.current.height = canvasRefRef.current.clientHeight;

    ctx.strokeStyle = '#2ed3ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(46, 211, 255, 0.42)';
    ctx.shadowBlur = 7;

    const canvasBox = canvasRefRef.current.getBoundingClientRect();
    const personBox = personRef.current.getBoundingClientRect();

    const controlsPosIds = controlsPos.map(({ id: cid }) => cid);
    const slots = slotsPos.map((slot) => {
      const slotPosition = getOffset(slot, canvasBox);
      return {
        ...slotPosition,
        id: slot.id,
        rotation: Number(slot.dataset.rotation || 0),
        hidden:
          variant === 'tracker-select' && !controlsPosIds.includes(slot.id),
        buttonOffset: {
          left: canvasBox.left - personBox.left,
          top: canvasBox.top - personBox.top,
        },
      };
    });

    if (variant === 'tracker-select') {
      slots.forEach((slot) => {
        const controls = controlsPos.filter(({ id }) => id === slot.id);
        controls.forEach((control) => {
          const controlPosition = getOffset(control, canvasBox);

          const offsetX =
            controlPosition.left < slot.left ? controlPosition.width : 0;

          const constolLeft = controlPosition.left + offsetX;
          const LINE_BREAK_WIDTH = isMobile ? 20 : 40;
          const leftOffsetX =
            LINE_BREAK_WIDTH * (controlPosition.left < slot.left ? -1 : 1);

          ctx.beginPath();
          ctx.moveTo(
            constolLeft,
            controlPosition.top + controlPosition.height / 2
          );
          ctx.lineTo(
            constolLeft - leftOffsetX,
            controlPosition.top + controlPosition.height / 2
          );
          ctx.lineTo(slot.left + slot.width / 2, slot.top + slot.height / 2);
          ctx.stroke();
        });
      });
    }
    setSlotsButtonPos(slots);
  }, [isMobile, variant]);

  useEffect(() => {
    updateSlots();
  }, [leftControls, mirror, rightControls, updateSlots]);

  useEffect(() => {
    if (
      !rightContainerRef.current ||
      !leftContainerRef.current ||
      !personRef.current
    )
      return;

    const resizeObserver = new ResizeObserver(updateSlots);
    const mutationObserver = new MutationObserver(updateSlots);

    resizeObserver.observe(personRef.current);

    mutationObserver.observe(rightContainerRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    mutationObserver.observe(leftContainerRef.current, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [updateSlots]);

  return (
    <div className="raptor-body-map relative w-full h-full">
      <canvas
        ref={canvasRefRef}
        className="absolute w-full h-full top-0 z-10 pointer-events-none"
        width="100%"
        height="100%"
      />
      <div className="flex w-full h-full gap-5">
        <div ref={leftContainerRef} className="z-10">
          {leftControls}
        </div>
        <div
          ref={personRef}
          className={classNames(
            'raptor-body-map__figure relative flex justify-center flex-grow'
          )}
        >
          <PersonFrontIcon mirror={mirror} />
          {slotsButtonsPos.map(
            ({
              top,
              left,
              height,
              width,
              id,
              hidden,
              rotation,
              buttonOffset,
            }) => (
              <button
                type="button"
                key={id}
                data-body-part={id}
                className={classNames(
                  'absolute z-20 transition-opacity',
                  variant === 'tracker-select'
                    ? 'raptor-tracker-marker'
                    : 'raptor-body-map__dot-button',
                  hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
                onClick={() => onSelectRole((BodyPart as any)[id])}
                aria-label={`Assign tracker to ${id
                  .toLowerCase()
                  .replaceAll('_', ' ')}`}
                title={id.toLowerCase().replaceAll('_', ' ')}
                style={{
                  top: top + height / 2 + buttonOffset.top,
                  left: left + width / 2 + buttonOffset.left,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
              >
                {variant === 'tracker-select' ? (
                  <>
                    <span className="raptor-tracker-marker__strap" />
                    <span
                      className={classNames(
                        'raptor-tracker-marker__module',
                        assignedRoles.includes((BodyPart as any)[id]) &&
                          'raptor-tracker-marker__module--assigned'
                      )}
                    >
                      <span className="raptor-tracker-marker__brand">R</span>
                      <span className="raptor-tracker-marker__led" />
                    </span>
                  </>
                ) : (
                  <span
                    className={classNames(
                      'block rounded-full outline-background-90',
                      'raptor-body-map__dot hover:bg-accent-background-40',
                      assignedRoles.includes((BodyPart as any)[id])
                        ? 'bg-status-success'
                        : 'bg-background-10'
                    )}
                    style={{ width: dotsSize, height: dotsSize }}
                  />
                )}
                <span className="absolute inset-0">
                  {!hidden &&
                    highlightedRoles.includes((BodyPart as any)[id]) && (
                      <span
                        className={classNames(
                          'absolute rounded-full bg-status-warning raptor-tracker-marker__warning',
                          'transition-opacity opacity-100 animate-ping'
                        )}
                        style={{ animationDuration: '1.5s' }}
                      />
                    )}
                </span>
              </button>
            )
          )}
        </div>
        <div ref={rightContainerRef} className="z-10">
          {rightControls}
        </div>
      </div>
    </div>
  );
}
