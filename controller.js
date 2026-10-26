
import { GESTURES } from "./gestures.js";

// Converts hand gestures into camera commands.
export class GestureController {
  constructor({ resetHoldMs = 1000 } = {}) {
    this.resetHoldMs = resetHoldMs;
    this.reset();
  }

  reset() {
    this.lastGesture = GESTURES.UNKNOWN;
    this.lastWrist = null;
    this.lastPinch = null;
    this.palmStart = null;
    this.resetTriggered = false;
  }

  update(gesture, landmarks, now = performance.now()) {
    if (!landmarks || landmarks.length < 21) {
      this.reset();
      return null;
    }

    if (gesture !== this.lastGesture) {
      this.lastWrist = null;
      this.lastPinch = null;
      this.palmStart = null;
      this.resetTriggered = false;
      this.lastGesture = gesture;
    }

    if (gesture === GESTURES.FIST) {
      const wrist = landmarks[0];
      let action = null;

      if (this.lastWrist) {
       action = {
  type: "rotate",
  dx: (wrist.x - this.lastWrist.x) * 0.35,
  dy: (wrist.y - this.lastWrist.y) * 0.35
};

      this.lastWrist = { x: wrist.x, y: wrist.y };
      return action;
    }

    if (gesture === GESTURES.PINCH) {
      const thumb = landmarks[4];
      const index = landmarks[8];
      const distance = Math.hypot(
        thumb.x - index.x,
        thumb.y - index.y
      );

      let action = null;

      if (this.lastPinch !== null) {
        action = {
          type: "zoom",
          delta: distance - this.lastPinch
        };
      }

      this.lastPinch = distance;
      return action;
    }

    if (gesture === GESTURES.PALM) {
      if (this.palmStart === null) {
        this.palmStart = now;
      }

      if (
        !this.resetTriggered &&
        now - this.palmStart >= this.resetHoldMs
      ) {
        this.resetTriggered = true;
        return { type: "reset" };
      }
    }

    return null;
  }
}
}
