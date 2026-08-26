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

export function PersonFrontIcon({ mirror = true }: { mirror?: boolean }) {
  const left = +!mirror;
  const right = +mirror;

  const anchors: BodyAnchor[] = [
    { part: BodyPart.HEAD, x: 512, y: 225 },
    { part: BodyPart.NECK, x: 512, y: 400 },
    { part: BodyPart.UPPER_CHEST, x: 512, y: 480 },
    { part: BodyPart.CHEST, x: 512, y: 565 },
    { part: BodyPart.WAIST, x: 512, y: 705 },
    { part: BodyPart.HIP, x: 512, y: 830 },
    {
      part: SIDES[right].shoulder,
      x: 642,
      y: 490,
      rotation: -12,
    },
    {
      part: SIDES[right].upperArm,
      x: 686,
      y: 600,
      rotation: -18,
    },
    {
      part: SIDES[right].lowerArm,
      x: 738,
      y: 744,
      rotation: -22,
    },
    { part: SIDES[right].hand, x: 762, y: 846, rotation: -12 },
    {
      part: SIDES[right].upperLeg,
      x: 608,
      y: 982,
      rotation: -6,
    },
    {
      part: SIDES[right].lowerLeg,
      x: 630,
      y: 1182,
      rotation: -3,
    },
    { part: SIDES[right].foot, x: 660, y: 1394, rotation: 8 },
    {
      part: SIDES[left].shoulder,
      x: 382,
      y: 490,
      rotation: 12,
    },
    {
      part: SIDES[left].upperArm,
      x: 338,
      y: 600,
      rotation: 18,
    },
    {
      part: SIDES[left].lowerArm,
      x: 286,
      y: 744,
      rotation: 22,
    },
    { part: SIDES[left].hand, x: 262, y: 846, rotation: 12 },
    {
      part: SIDES[left].upperLeg,
      x: 416,
      y: 982,
      rotation: 6,
    },
    {
      part: SIDES[left].lowerLeg,
      x: 394,
      y: 1182,
      rotation: 3,
    },
    { part: SIDES[left].foot, x: 364, y: 1394, rotation: -8 },
  ];

  return (
    <svg
      className="raptor-assignment-mascot"
      width="100%"
      viewBox="0 0 1024 1536"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="White RaptorVR humanoid dinosaur body map"
      role="img"
    >
      <image
        width="1024"
        height="1536"
        preserveAspectRatio="xMidYMid meet"
        href="/images/raptorvr-assignment-mascot.png"
      />
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
