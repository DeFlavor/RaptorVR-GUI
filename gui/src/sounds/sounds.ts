import { ResetResponseT, ResetStatus, ResetType } from 'solarxr-protocol';

type RaptorTone = {
  at?: number;
  duration: number;
  fromHz: number;
  gain: number;
  toHz?: number;
  wave: OscillatorType;
};

type RaptorCue = {
  tones: RaptorTone[];
};

export type RaptorSound = RaptorCue | null;

const cue = (tones: RaptorTone[]): RaptorCue => ({ tones });
const tone = (
  fromHz: number,
  toHz: number,
  duration: number,
  at = 0,
  gain = 0.16,
  wave: OscillatorType = 'triangle'
): RaptorTone => ({ at, duration, fromHz, gain, toHz, wave });

// RaptorVR uses a short sci-fi chirp language instead of SlimeVR's bundled
// samples. The rising fifth is the recognizable RaptorVR audio signature.
const raptorConfirmation = cue([
  tone(260, 520, 0.16, 0, 0.13, 'sawtooth'),
  tone(520, 780, 0.2, 0.1, 0.11, 'triangle'),
  tone(130, 105, 0.3, 0, 0.06, 'sine'),
]);

export const scaledProportionsClick = cue([
  tone(470, 620, 0.1, 0, 0.12, 'triangle'),
  tone(705, 850, 0.12, 0.055, 0.08, 'sine'),
]);

const resetSounds: Record<
  ResetType,
  {
    initial: RaptorSound;
    tick: RaptorCue[] | null;
    end: RaptorCue;
    accent: RaptorSound;
  }
> = {
  [ResetType.Full]: {
    initial: cue([
      tone(115, 230, 0.34, 0, 0.09, 'sawtooth'),
      tone(320, 640, 0.28, 0.07, 0.1, 'triangle'),
    ]),
    tick: [
      cue([tone(390, 350, 0.075, 0, 0.1, 'square')]),
      cue([tone(520, 465, 0.075, 0, 0.1, 'square')]),
      cue([tone(650, 580, 0.075, 0, 0.1, 'square')]),
    ],
    end: raptorConfirmation,
    accent: cue([
      tone(92, 72, 0.42, 0.02, 0.055, 'sawtooth'),
      tone(184, 138, 0.31, 0.05, 0.035, 'triangle'),
    ]),
  },
  [ResetType.Yaw]: {
    initial: null,
    tick: null,
    end: cue([
      tone(820, 330, 0.23, 0, 0.11, 'sine'),
      tone(260, 520, 0.2, 0.1, 0.1, 'triangle'),
    ]),
    accent: null,
  },
  [ResetType.Mounting]: {
    initial: cue([
      tone(165, 105, 0.28, 0, 0.08, 'sawtooth'),
      tone(740, 370, 0.24, 0.04, 0.08, 'triangle'),
    ]),
    tick: [
      cue([
        tone(190, 140, 0.065, 0, 0.1, 'square'),
        tone(760, 620, 0.055, 0, 0.045, 'triangle'),
      ]),
      cue([
        tone(225, 165, 0.065, 0, 0.1, 'square'),
        tone(850, 690, 0.055, 0, 0.045, 'triangle'),
      ]),
      cue([
        tone(260, 190, 0.065, 0, 0.1, 'square'),
        tone(940, 760, 0.055, 0, 0.045, 'triangle'),
      ]),
    ],
    end: cue([
      tone(540, 270, 0.22, 0, 0.11, 'triangle'),
      tone(270, 540, 0.22, 0.12, 0.09, 'sine'),
    ]),
    accent: cue([tone(105, 82, 0.28, 0.02, 0.045, 'sawtooth')]),
  },
};

export const trackingPauseSound = cue([
  tone(720, 360, 0.18, 0, 0.11, 'triangle'),
  tone(360, 180, 0.2, 0.08, 0.07, 'sawtooth'),
]);

export const trackingPlaySound = cue([
  tone(220, 440, 0.16, 0, 0.1, 'sawtooth'),
  tone(440, 660, 0.19, 0.09, 0.1, 'triangle'),
]);

const tapCues = [
  cue([tone(330, 495, 0.13, 0, 0.1, 'triangle')]),
  cue([tone(392, 588, 0.13, 0, 0.1, 'triangle')]),
  cue([tone(440, 660, 0.13, 0, 0.1, 'triangle')]),
  cue([tone(495, 742, 0.13, 0, 0.1, 'triangle')]),
  cue([tone(588, 880, 0.13, 0, 0.1, 'triangle')]),
];

let lastTap = 0;
let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (audioContext) return audioContext;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext = new AudioContextClass();
  return audioContext;
}

function playCue(sound: RaptorCue, volume: number) {
  const context = getAudioContext();
  if (!context) return;

  context.resume().catch(() => undefined);
  const now = context.currentTime + 0.01;
  const output = context.createGain();
  const adjustedVolume = Math.min(1, Math.pow(volume, Math.E) + 0.05);
  output.gain.value = adjustedVolume;
  output.connect(context.destination);

  let cueEnd = 0;
  sound.tones.forEach((note) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const start = now + (note.at ?? 0);
    const end = start + note.duration;
    cueEnd = Math.max(cueEnd, (note.at ?? 0) + note.duration);

    oscillator.type = note.wave;
    oscillator.frequency.setValueAtTime(note.fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, note.toHz ?? note.fromHz),
      end
    );

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(note.gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  });

  window.setTimeout(() => output.disconnect(), (cueEnd + 0.2) * 1000);
}

export async function playTapSetupSound(volume = 1) {
  playCue(tapCues[lastTap], volume);
  lastTap = (lastTap + 1) % tapCues.length;
}

export function restartAndPlay(sound: RaptorSound, volume: number) {
  if (!sound) return;
  try {
    playCue(sound, volume);
  } catch (error) {
    console.error('RaptorVR audio error:', error);
  }
}

export function handleResetSounds(
  volume: number,
  { progress, status, resetType }: ResetResponseT
) {
  const sounds = resetSounds[resetType];
  if (!sounds) throw 'reset type does not have a reset sound: ' + resetType;

  if (status === ResetStatus.STARTED) {
    if (progress === 0) {
      restartAndPlay(sounds.initial, volume);
    }

    if (sounds.tick) {
      const arrayLength = sounds.tick.length;
      const cycleLength = arrayLength * 2 - 2;
      const positionInCycle = Math.floor(progress / 1000) % cycleLength;
      const tickIndex =
        positionInCycle < arrayLength ? positionInCycle : cycleLength - positionInCycle;

      if (progress >= 1000 && sounds.tick[tickIndex]) {
        restartAndPlay(sounds.tick[tickIndex], volume);
      }
    }
  }

  if (status === ResetStatus.FINISHED) {
    restartAndPlay(sounds.end, volume);
    restartAndPlay(sounds.accent, volume);
  }
}
