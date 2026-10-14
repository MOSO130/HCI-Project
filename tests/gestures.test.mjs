// Run with: node tests/gestures.test.mjs
import assert from "node:assert/strict";
import { classifyHand, GestureSmoother, GESTURES } from "../gestures.js";

// Builds a synthetic upright hand (y grows downward, like image coordinates).
// Each finger is given as the positions of [mcp, pip, dip, tip] relative to the wrist.
function hand({ thumb, index, middle, ring, pinky }) {
  const wrist = { x: 0.5, y: 0.8, z: 0 };
  const pts = [wrist];
  const add = (arr) => arr.forEach(([x, y]) => pts.push({ x: 0.5 + x, y: 0.8 + y, z: 0 }));
  add(thumb); add(index); add(middle); add(ring); add(pinky);
  return pts;
}

const extended = (x) => [[x, -0.2], [x, -0.28], [x, -0.33], [x, -0.38]];
const curled = (x) => [[x, -0.2], [x, -0.26], [x, -0.2], [x, -0.15]];
const thumbOut = [[-0.06, -0.06], [-0.12, -0.1], [-0.17, -0.13], [-0.22, -0.15]];
const thumbTucked = [[-0.05, -0.06], [-0.07, -0.12], [-0.04, -0.16], [0.0, -0.18]];

const palm = hand({ thumb: thumbOut, index: extended(-0.06), middle: extended(0), ring: extended(0.05), pinky: extended(0.1) });
const fist = hand({ thumb: thumbTucked, index: curled(-0.06), middle: curled(0), ring: curled(0.05), pinky: curled(0.1) });
// Pinch: index bent forward so its tip meets the thumb tip; other fingers curled.
const pinch = hand({
  thumb: [[-0.06, -0.06], [-0.11, -0.12], [-0.13, -0.18], [-0.12, -0.23]],
  index: [[-0.06, -0.2], [-0.08, -0.27], [-0.11, -0.27], [-0.12, -0.245]],
  middle: curled(0), ring: curled(0.05), pinky: curled(0.1),
});

const aspect = 1; // synthetic coords are already square

assert.equal(classifyHand(palm, aspect).gesture, GESTURES.PALM, "palm");
assert.equal(classifyHand(fist, aspect).gesture, GESTURES.FIST, "fist");
assert.equal(classifyHand(pinch, aspect).gesture, GESTURES.PINCH, "pinch");

const s = new GestureSmoother(7, 5);
["palm", "palm", "fist", "palm", "palm", "palm"].forEach((g) => s.push(g));
assert.equal(s.stable, "palm", "smoother settles on majority");
s.push("fist");
assert.equal(s.stable, "palm", "one stray frame doesn't flip it");

console.log("All gesture tests passed.");
