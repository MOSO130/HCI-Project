import {
  FilesetResolver,
  HandLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/vision_bundle.mjs";
import { classifyHand, GestureSmoother, GESTURES } from "./gestures.js";
import { GestureController } from "./controller.js";
import { createMoleculeViewer } from "./molecule.js";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// How long the hand can disappear before we show "Tracking Lost" (ms).
const LOST_AFTER_MS = 700;

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const startPanel = document.getElementById("startPanel");
const loadMsg = document.getElementById("loadMsg");
const showSkeleton = document.getElementById("showSkeleton");

const card = document.getElementById("card");
const cardTitle = document.getElementById("cardTitle");
const cardImg = document.getElementById("cardImg");
const cardLabel = document.getElementById("cardLabel");
const cardHint = document.getElementById("cardHint");
const minis = document.querySelectorAll(".mini");

const VIEWS = {
  [GESTURES.FIST]: { cls: "active", title: "Active Gesture", img: "assets/fist.png", label: "Fist", hint: "" },
  [GESTURES.PINCH]: { cls: "active", title: "Active Gesture", img: "assets/pinch.png", label: "Pinch", hint: "" },
  [GESTURES.PALM]: { cls: "active", title: "Active Gesture", img: "assets/palm.png", label: "Palm", hint: "" },
  [GESTURES.UNKNOWN]: { cls: "unknown", title: "Hand Detected", img: "assets/palm.png", label: "No Gesture", hint: "Try a fist, pinch, or open palm" },
  lost: { cls: "lost", title: "", img: "assets/warning.png", label: "Tracking Lost", hint: "Please check lighting and camera" },
};

let handLandmarker = null;
let drawer = null;
let lastVideoTime = -1;
let lastSeen = 0;
let currentView = null;
const smoother = new GestureSmoother();
const controller = new GestureController();
const moleculeViewer = createMoleculeViewer(
  document.getElementById("moleculeViewer")
);

function showView(key) {
  if (key === currentView) return;
  currentView = key;
  const v = VIEWS[key];
  card.className = `card ${v.cls}`;
  cardTitle.textContent = v.title;
  cardImg.src = v.img;
  cardLabel.textContent = v.label;
  cardHint.textContent = v.hint;
  card.classList.add("pop");
  setTimeout(() => card.classList.remove("pop"), 150);
  minis.forEach((m) => m.classList.toggle("on", m.dataset.g === key));
}

async function loadModel() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const opts = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  });
  try {
    return await HandLandmarker.createFromOptions(vision, opts("GPU"));
  } catch {
    return await HandLandmarker.createFromOptions(vision, opts("CPU"));
  }
}

async function start() {
  startBtn.disabled = true;
  try {
    loadMsg.textContent = "Loading hand model…";
    handLandmarker = await loadModel();

    loadMsg.textContent = "Requesting camera…";
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();

    // If the camera is unplugged or stops, show Tracking Lost.
    stream.getVideoTracks().forEach((t) => t.addEventListener("ended", () => showView("lost")));

    drawer = new DrawingUtils(ctx);
    startPanel.classList.add("hidden");
    lastSeen = performance.now();
    showView("lost");
    requestAnimationFrame(loop);
  } catch (err) {
    console.error(err);
    startBtn.disabled = false;
    loadMsg.textContent =
      err && err.name === "NotAllowedError"
        ? "Camera permission was denied. Allow camera access and try again."
        : String(err?.message || err).includes("model")
          ? "Couldn't download the hand model. Check your internet connection and try again."
          : `Couldn't start: ${err?.message || err}`;
    showView("lost");
  }
}

function loop() {
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const now = performance.now();
    const result = handLandmarker.detectForVideo(video, now);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hand = result.landmarks && result.landmarks[0];
    if (hand) {
      lastSeen = now;
      const aspect = video.videoWidth / video.videoHeight || 4 / 3;
      const { gesture } = classifyHand(hand, aspect);
      showView(smoother.push(gesture));
      const command = controller.update(gesture, hand, now);
  if (command) {
  if (command.type === "rotate") {
    moleculeViewer.rotate(command.dx, command.dy);
  } else if (command.type === "zoom") {
    moleculeViewer.zoom(command.delta);
  } else if (command.type === "reset") {
    moleculeViewer.reset();
  }
}
      

      if (showSkeleton.checked) {
        drawer.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: "#66b0a2", lineWidth: 4 });
        drawer.drawLandmarks(hand, { color: "#f0cd6c", lineWidth: 1, radius: 4 });
      }
  } else if (now - lastSeen > LOST_AFTER_MS) {
  smoother.reset();
  controller.reset();
  showView("lost");
}
    }
  }
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", start);
