
import test from "node:test";
import assert from "node:assert/strict";
import { GestureController } from "../controller.js";
import { GESTURES } from "../gestures.js";

function makeHand() {
  return Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0
  }));
}

test("fist movement rotates the camera", () => {
  const controller = new GestureController();
  const hand = makeHand();

  assert.equal(controller.update(GESTURES.FIST, hand, 0), null);

  hand[0].x = 0.6;
  const action = controller.update(GESTURES.FIST, hand, 100);

  assert.equal(action.type, "rotate");
  assert.ok(Math.abs(action.dx - 0.1) < 0.00001);
});

test("pinch movement creates zoom action", () => {
  const controller = new GestureController();
  const hand = makeHand();

  hand[4].x = 0.4;
  hand[8].x = 0.6;

  controller.update(GESTURES.PINCH, hand, 0);

  hand[8].x = 0.7;
  const action = controller.update(GESTURES.PINCH, hand, 100);

  assert.equal(action.type, "zoom");
  assert.ok(action.delta > 0);
});

test("holding palm resets camera", () => {
  const controller = new GestureController();
  const hand = makeHand();

  assert.equal(controller.update(GESTURES.PALM, hand, 0), null);

  const action = controller.update(GESTURES.PALM, hand, 1100);
  assert.deepEqual(action, { type: "reset" });

  // Reset should only trigger once per hold.
  assert.equal(controller.update(GESTURES.PALM, hand, 1200), null);
});

test("losing tracking stops movement", () => {
  const controller = new GestureController();
  const hand = makeHand();

  controller.update(GESTURES.FIST, hand, 0);

  assert.equal(controller.update(GESTURES.FIST, null, 100), null);

  // After tracking returns, establish a new starting position.
  assert.equal(controller.update(GESTURES.FIST, hand, 200), null);
});

test("switching gestures clears previous movement", () => {
  const controller = new GestureController();
  const hand = makeHand();

  controller.update(GESTURES.FIST, hand, 0);
  assert.equal(controller.update(GESTURES.PINCH, hand, 100), null);
});
