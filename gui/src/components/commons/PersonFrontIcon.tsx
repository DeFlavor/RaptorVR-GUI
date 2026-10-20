import { BodyPart } from 'solarxr-protocol';

export const SIDES = [
  {
    shoulder: BodyPart.LEFT_SHOULDER,
    upperArm: BodyPart.LEFT_UPPER_ARM,
    lowerArm: BodyPart.LEFT_LOWER_ARM,
    hand: BodyPart.LEFT_HAND,
    upperLeg: BodyPart.LEFT_UPPER_LEG,
    lowerLeg: BodyPart.LEFT_LOWER_LEG,
    foot: BodyPart.LEFT_FOOT,
  },
  {
    shoulder: BodyPart.RIGHT_SHOULDER,
    upperArm: BodyPart.RIGHT_UPPER_ARM,
    lowerArm: BodyPart.RIGHT_LOWER_ARM,
    hand: BodyPart.RIGHT_HAND,
    upperLeg: BodyPart.RIGHT_UPPER_LEG,
    lowerLeg: BodyPart.RIGHT_LOWER_LEG,
    foot: BodyPart.RIGHT_FOOT,
  },
];

type BodyAnchor = {
  part: BodyPart;
  x: number;
  y: number;
  rotation?: number;
};

/**
 * A neutral, original RaptorVR assignment mannequin. The invisible anchors are
 * consumed by BodyInteractions to place the assignment controls over the SVG.
 */
export function PersonFrontIcon({ mirror = true }: { mirror?: boolean }) {
  const left = +!mirror;
  const right = +mirror;

  const anchors: BodyAnchor[] = [
    { part: BodyPart.HEAD, x: 512, y: 166 },
    { part: BodyPart.NECK, x: 512, y: 330 },
    { part: BodyPart.UPPER_CHEST, x: 512, y: 430 },
    { part: BodyPart.CHEST, x: 512, y: 535 },
    { part: BodyPart.WAIST, x: 512, y: 680 },
    { part: BodyPart.HIP, x: 512, y: 800 },
    { part: SIDES[right].shoulder, x: 654, y: 442, rotation: -8 },
    { part: SIDES[right].upperArm, x: 716, y: 575, rotation: -15 },
    { part: SIDES[right].lowerArm, x: 772, y: 746, rotation: -18 },
    { part: SIDES[right].hand, x: 810, y: 882, rotation: -10 },
    { part: SIDES[right].upperLeg, x: 611, y: 985, rotation: -4 },
    { part: SIDES[right].lowerLeg, x: 630, y: 1210, rotation: -2 },
    { part: SIDES[right].foot, x: 662, y: 1430, rotation: 8 },
    { part: SIDES[left].shoulder, x: 370, y: 442, rotation: 8 },
    { part: SIDES[left].upperArm, x: 308, y: 575, rotation: 15 },
    { part: SIDES[left].lowerArm, x: 252, y: 746, rotation: 18 },
    { part: SIDES[left].hand, x: 214, y: 882, rotation: 10 },
    { part: SIDES[left].upperLeg, x: 413, y: 985, rotation: 4 },
    { part: SIDES[left].lowerLeg, x: 394, y: 1210, rotation: 2 },
    { part: SIDES[left].foot, x: 362, y: 1430, rotation: -8 },
  ];

  return (
    <svg
      className="raptor-assignment-mascot"
      width="100%"
      viewBox="0 0 1024 1536"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gray faceless RaptorVR tracker-assignment mannequin"
      role="img"
    >
      <defs>
        <linearGradient id="mannequin-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d2d5d8" />
          <stop offset="0.5" stopColor="#a7acb2" />
          <stop offset="1" stopColor="#737981" />
        </linearGradient>
        <linearGradient id="mannequin-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#747a82" />
          <stop offset="1" stopColor="#b9bdc2" />
        </linearGradient>
        <linearGradient id="mannequin-right" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#747a82" />
          <stop offset="1" stopColor="#b9bdc2" />
        </linearGradient>
        <radialGradient id="mannequin-head" cx="40%" cy="28%" r="72%">
          <stop offset="0" stopColor="#d7dade" />
          <stop offset="0.62" stopColor="#a5aab0" />
          <stop offset="1" stopColor="#777d84" />
        </radialGradient>
        <filter
          id="mannequin-shadow"
          x="-30%"
          y="-20%"
          width="160%"
          height="150%"
        >
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="16"
            floodColor="#000000"
            floodOpacity="0.34"
          />
        </filter>
      </defs>

      <g
        className="raptor-mannequin"
        filter="url(#mannequin-shadow)"
        stroke="#555b62"
        strokeWidth="5"
        strokeLinejoin="round"
      >
        {/* Blank head and neck: intentionally no face, hair, or clothing. */}
        <ellipse
          cx="512"
          cy="165"
          rx="91"
          ry="122"
          fill="url(#mannequin-head)"
        />
        <path
          d="M456 273 C470 292 475 315 474 354 L550 354 C549 315 554 292 568 273 Z"
          fill="url(#mannequin-core)"
        />

        {/* Neutral torso and pelvis. */}
        <path
          d="M389 365 C426 341 465 337 512 337 C559 337 598 341 635 365 L680 421 C653 489 635 562 626 634 C620 691 592 732 563 762 L461 762 C432 732 404 691 398 634 C389 562 371 489 344 421 Z"
          fill="url(#mannequin-core)"
        />
        <path
          d="M461 746 C423 773 401 817 399 874 L465 909 L512 862 L559 909 L625 874 C623 817 601 773 563 746 Z"
          fill="url(#mannequin-core)"
        />

        {/* Left arm. */}
        <path
          d="M355 402 C326 409 301 428 286 458 L252 603 C252 622 266 638 286 642 L323 650 C343 651 357 640 363 620 L394 469 C399 439 383 410 355 402 Z"
          fill="url(#mannequin-left)"
        />
        <path
          d="M283 621 C263 621 247 634 241 654 L193 821 C190 842 202 859 222 865 L246 871 C266 871 279 859 285 839 L328 664 C330 644 315 626 295 623 Z"
          fill="url(#mannequin-left)"
        />
        <path
          d="M214 844 C191 854 179 875 181 906 L191 958 C195 979 214 990 231 979 L252 955 C263 943 265 924 260 900 L249 860 Z"
          fill="url(#mannequin-left)"
        />

        {/* Right arm. */}
        <path
          d="M669 402 C698 409 723 428 738 458 L772 603 C772 622 758 638 738 642 L701 650 C681 651 667 640 661 620 L630 469 C625 439 641 410 669 402 Z"
          fill="url(#mannequin-right)"
        />
        <path
          d="M741 621 C761 621 777 634 783 654 L831 821 C834 842 822 859 802 865 L778 871 C758 871 745 859 739 839 L696 664 C694 644 709 626 729 623 Z"
          fill="url(#mannequin-right)"
        />
        <path
          d="M810 844 C833 854 845 875 843 906 L833 958 C829 979 810 990 793 979 L772 955 C761 943 759 924 764 900 L775 860 Z"
          fill="url(#mannequin-right)"
        />

        {/* Left leg and foot. */}
        <path
          d="M404 850 C383 906 376 985 379 1076 C381 1099 398 1113 422 1115 L458 1112 C478 1107 488 1092 489 1071 L487 891 L465 872 Z"
          fill="url(#mannequin-left)"
        />
        <path
          d="M382 1084 C365 1142 356 1247 358 1361 C360 1382 376 1394 398 1394 L425 1392 C444 1388 455 1374 456 1355 L464 1100 C440 1085 411 1079 382 1084 Z"
          fill="url(#mannequin-left)"
        />
        <path
          d="M356 1347 C340 1373 315 1400 282 1428 C267 1441 269 1467 292 1473 L417 1473 C442 1469 451 1451 440 1428 L423 1382 Z"
          fill="url(#mannequin-left)"
        />

        {/* Right leg and foot. */}
        <path
          d="M620 850 C641 906 648 985 645 1076 C643 1099 626 1113 602 1115 L566 1112 C546 1107 536 1092 535 1071 L537 891 L559 872 Z"
          fill="url(#mannequin-right)"
        />
        <path
          d="M642 1084 C659 1142 668 1247 666 1361 C664 1382 648 1394 626 1394 L599 1392 C580 1388 569 1374 568 1355 L560 1100 C584 1085 613 1079 642 1084 Z"
          fill="url(#mannequin-right)"
        />
        <path
          d="M668 1347 C684 1373 709 1400 742 1428 C757 1441 755 1467 732 1473 L607 1473 C582 1469 573 1451 584 1428 L601 1382 Z"
          fill="url(#mannequin-right)"
        />

        {/* Subtle mannequin joints add depth without implying clothing. */}
        <g fill="#858b92" stroke="#60666d" strokeWidth="4">
          <ellipse cx="360" cy="439" rx="35" ry="39" />
          <ellipse cx="664" cy="439" rx="35" ry="39" />
          <ellipse cx="286" cy="635" rx="31" ry="28" />
          <ellipse cx="738" cy="635" rx="31" ry="28" />
          <ellipse cx="421" cy="1096" rx="38" ry="26" />
          <ellipse cx="603" cy="1096" rx="38" ry="26" />
        </g>
        <path
          d="M512 355 L512 742"
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="3"
        />
      </g>

      {anchors.map(({ part, x, y, rotation = 0 }) => (
        <circle
          key={part}
          className="body-part-circle"
          cx={x}
          cy={y}
          r="1"
          fill="transparent"
          aria-hidden="true"
          data-rotation={rotation}
          id={BodyPart[part]}
        />
      ))}
    </svg>
  );
}
