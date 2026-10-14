# HCI-Project — Hand Gesture Detector

A simple web app that uses your webcam to detect three hand gestures in real time:

| Gesture | How to make it |
|---|---|
| **Fist** | Curl all four fingers into your palm |
| **Pinch** | Touch your thumb tip to your index fingertip |
| **Palm** | Open hand, all fingers spread |

If no hand is seen for a moment (or the camera stops), the app shows **Tracking Lost — Please check lighting and camera**.

Everything runs in the browser. Video never leaves your computer.

## Running it

The camera only works on `https://` or `localhost`, so open it through a local server rather than double-clicking `index.html`:

```bash
# any of these, from the project folder
npx serve .
python3 -m http.server 8000   # then open http://localhost:8000
```

Click **Start camera**, allow camera access, and hold your hand up.

It also works as-is on GitHub Pages (Settings → Pages → deploy from `main`).

## How it works

1. **Hand tracking** — [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) finds 21 landmarks on the hand each frame (loaded from a CDN).
2. **Classification** (`gestures.js`) — simple geometric rules, all scaled by hand size so distance from the camera doesn't matter:
   - *Pinch*: thumb tip and index tip are very close, and the index is still reaching out (not folded into a fist).
   - *Palm*: all four fingertips are farther from the wrist than their middle joints, and the thumb is out.
   - *Fist*: the fingertips are curled back toward the wrist.
3. **Smoothing** — a gesture has to win 5 of the last 7 frames before the display changes, so it doesn't flicker.
4. **Tracking lost** — no hand for 700 ms, a camera error, or the camera being unplugged.

Thresholds live at the top of `gestures.js` (`THRESHOLDS`) if you want to tune them.

## Files

```
index.html          page layout
style.css           styling (card colors match the design mockup)
app.js              camera, MediaPipe setup, UI updates
gestures.js         gesture rules + smoothing
assets/             gesture artwork
tests/              node tests for the classifier (npm test)
```
