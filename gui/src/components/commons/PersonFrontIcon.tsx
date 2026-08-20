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

export function PersonFrontIcon({ mirror = true }: { mirror?: boolean }) {
  const CIRCLE_RADIUS = 0.0001;
  const left = +!mirror;
  const right = +mirror;

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
      <circle
        className="body-part-circle"
        cx="512"
        cy="480"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.UPPER_CHEST]}
      />
      <circle
        className="body-part-circle"
        cx="512"
        cy="585"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.CHEST]}
      />
      <circle
        className="body-part-circle"
        cx="512"
        cy="850"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.HIP]}
      />
      <circle
        className="body-part-circle"
        cx="512"
        cy="735"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.WAIST]}
      />
      <circle
        className="body-part-circle"
        cx="512"
        cy="390"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.NECK]}
      />
      <circle
        className="body-part-circle"
        cx="512"
        cy="270"
        r={CIRCLE_RADIUS}
        id={BodyPart[BodyPart.HEAD]}
      />
      <circle
        className="body-part-circle"
        cx="775"
        cy="900"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].hand]}
      />
      <circle
        className="body-part-circle"
        cx="690"
        cy="610"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].upperArm]}
      />
      <circle
        className="body-part-circle"
        cx="655"
        cy="475"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].shoulder]}
      />
      <circle
        className="body-part-circle"
        cx="750"
        cy="785"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].lowerArm]}
      />
      <circle
        className="body-part-circle"
        cx="645"
        cy="1215"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].lowerLeg]}
      />
      <circle
        className="body-part-circle"
        cx="615"
        cy="980"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].upperLeg]}
      />
      <circle
        className="body-part-circle"
        cx="690"
        cy="1430"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[right].foot]}
      />

      <circle
        className="body-part-circle"
        cx="250"
        cy="900"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].hand]}
      />

      <circle
        className="body-part-circle"
        cx="335"
        cy="610"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].upperArm]}
      />
      <circle
        className="body-part-circle"
        cx="370"
        cy="475"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].shoulder]}
      />
      <circle
        className="body-part-circle"
        cx="275"
        cy="785"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].lowerArm]}
      />
      <circle
        className="body-part-circle"
        cx="390"
        cy="1215"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].lowerLeg]}
      />

      <circle
        className="body-part-circle"
        cx="420"
        cy="980"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].upperLeg]}
      />
      <circle
        className="body-part-circle"
        cx="345"
        cy="1430"
        r={CIRCLE_RADIUS}
        id={BodyPart[SIDES[left].foot]}
      />
    </svg>
  );
}
