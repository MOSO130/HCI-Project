// Gesture classification from MediaPipe hand landmarks.
// Landmark indices: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
//   0 wrist | thumb 1-4 | index 5-8 | middle 9-12 | ring 13-16 | pinky 17-20

export const GESTURES = {
  FIST: "fist",
  PINCH: "pinch",
  PALM: "palm",
  UNKNOWN: "unknown",
};

// Tunable thresholds (all distances are relative to hand size, so they work at any camera distance).
export const THRESHOLDS = {
  pinchMax: 0.3,          // thumb tip ↔ index tip must be closer than this
  pinchIndexReach: 0.85,  // index tip must still be out from the wrist (separates pinch from a fist)
  extendRatio: 1.1,       // finger tip must be this much farther from wrist than its middle joint
  curlRatio: 1.0,         // finger tip closer to wrist than this × middle joint = curled
  thumbOut: 0.55,         // thumb tip ↔ index knuckle distance for an open thumb
};

const FINGERS = [
  { tip: 8, pip: 6 },   // index
  { tip: 12, pip: 10 }, // middle
  { tip: 16, pip: 14 }, // ring
  { tip: 20, pip: 18 }, // pinky
];

function makeDist(landmarks, aspect) {
  // Landmarks are normalized to image width/height; scale x so distances are in true proportion.
  return (a, b) => {
    const p = landmarks[a], q = landmarks[b];
    const dx = (p.x - q.x) * aspect;
    const dy = p.y - q.y;
    const dz = (p.z - q.z) * aspect;
    return Math.hypot(dx, dy, dz);
  };
}

/**
 * Classify one hand.
 * @param {{x:number,y:number,z:number}[]} landmarks 21 normalized landmarks
 * @param {number} aspect video width / height
 * @returns {{gesture:string, features:object}}
 */
export function classifyHand(landmarks, aspect = 4 / 3, t = THRESHOLDS) {
  const d = makeDist(landmarks, aspect);
  const size = d(0, 9) || 1e-6; // wrist → middle knuckle

  let extended = 0;
  let curled = 0;
  for (const f of FINGERS) {
    const tipDist = d(0, f.tip);
    const pipDist = d(0, f.pip);
    if (tipDist > pipDist * t.extendRatio) extended++;
    else if (tipDist < pipDist * t.curlRatio) curled++;
  }

  const pinchDist = d(4, 8) / size;
  const indexReach = d(0, 8) / size;
  const thumbOpen = d(4, 5) / size > t.thumbOut;

  const features = { extended, curled, pinchDist, indexReach, thumbOpen };

  let gesture = GESTURES.UNKNOWN;
  if (pinchDist < t.pinchMax && indexReach > t.pinchIndexReach) {
    gesture = GESTURES.PINCH;
  } else if (extended === 4 && thumbOpen) {
    gesture = GESTURES.PALM;
  } else if (curled >= 4 || (curled >= 3 && extended === 0)) {
    gesture = GESTURES.FIST;
  }
  return { gesture, features };
}

/**
 * Smooths per-frame labels so the display doesn't flicker.
 * A new gesture only becomes "stable" once it wins most of the recent window.
 */
export class GestureSmoother {
  constructor(windowSize = 7, minVotes = 5) {
    this.windowSize = windowSize;
    this.minVotes = minVotes;
    this.history = [];
    this.stable = GESTURES.UNKNOWN;
  }
  push(label) {
    this.history.push(label);
    if (this.history.length > this.windowSize) this.history.shift();
    const counts = {};
    for (const l of this.history) counts[l] = (counts[l] || 0) + 1;
    for (const [l, c] of Object.entries(counts)) {
      if (c >= this.minVotes) { this.stable = l; break; }
    }
    return this.stable;
  }
  reset() {
    this.history = [];
    this.stable = GESTURES.UNKNOWN;
  }
}
