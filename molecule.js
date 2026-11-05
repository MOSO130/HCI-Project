
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";

export function createMoleculeViewer(container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const molecule = new THREE.Group();
  scene.add(molecule);

  function atom(radius, color, x, y, z = 0) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshPhongMaterial({ color })
    );
    mesh.position.set(x, y, z);
    molecule.add(mesh);
  }

  function bond(start, end) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, direction.length(), 16),
      new THREE.MeshPhongMaterial({ color: 0xaaaaaa })
    );
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    molecule.add(mesh);
  }

function showWater() {
  while (molecule.children.length > 0) {
    const child = molecule.children[0];
    molecule.remove(child);
    child.geometry.dispose();
    child.material.dispose();
  }

  const oxygen = new THREE.Vector3(0, 0.5, 0);
  const hydrogen1 = new THREE.Vector3(-1.1, -0.5, 0);
  const hydrogen2 = new THREE.Vector3(1.1, -0.5, 0);

  bond(oxygen, hydrogen1);
  bond(oxygen, hydrogen2);

  atom(0.55, 0xff3333, ...oxygen.toArray());
  atom(0.35, 0xffffff, ...hydrogen1.toArray());
  atom(0.35, 0xffffff, ...hydrogen2.toArray());
}

showWater();
const MOLECULES = [
  "Water",
  "Caffeine",
  "Aspirin",
  "Adenine",
  "Ethanol",
  "Benzene",
  "Glucose"
];

let currentMolecule = 0;
function clearMolecule() {
  while (molecule.children.length > 0) {
    const child = molecule.children[0];
    molecule.remove(child);
    child.geometry.dispose();
    child.material.dispose();
  }
}



function showEthanol() {
  clearMolecule();

  const carbon1 = new THREE.Vector3(-1.2, 0, 0);
  const carbon2 = new THREE.Vector3(0, 0);
  const oxygen = new THREE.Vector3(1.2, 0.3, 0);
  const hydrogen = new THREE.Vector3(2, -0.3, 0);

  bond(carbon1, carbon2);
  bond(carbon2, oxygen);
  bond(oxygen, hydrogen);

  atom(0.45, 0x333333, ...carbon1.toArray());
  atom(0.45, 0x333333, ...carbon2.toArray());
  atom(0.5, 0xff3333, ...oxygen.toArray());
  atom(0.3, 0xffffff, ...hydrogen.toArray());
}
function showCaffeine() {
  clearMolecule();

  const positions = [
    [-1.4, 0.5, 0], [-0.5, 1.1, 0],
    [0.5, 1.1, 0], [1.4, 0.5, 0],
    [0.8, -0.5, 0], [-0.3, -0.7, 0],
    [-1.4, -0.6, 0], [1.7, -0.6, 0]
  ];

  const points = positions.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z)
  );

  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [4, 5], [5, 6], [6, 0], [4, 7]
  ];

  connections.forEach(([a, b]) => bond(points[a], points[b]));

  points.forEach((p, i) => {
    const color = [1, 3, 6, 7].includes(i)
      ? 0x3366ff
      : 0x333333;

    atom(0.35, color, ...p.toArray());
  });
}
function switchMolecule(index) {

  currentMolecule = (index + MOLECULES.length) % MOLECULES.length;

if (currentMolecule === 0) {
  showWater();
} else if (currentMolecule === 1) {
  showCaffeine();
} else if (currentMolecule === 4) {
  showEthanol();
}
}


  scene.add(new THREE.AmbientLight(0xffffff, 1.5));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(3, 5, 5);
  scene.add(light);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  return {
    switchMolecule,
    MOLECULES,
    
    rotate(dx, dy) {
      molecule.rotation.y += dx * 5;
      molecule.rotation.x += dy * 5;
    },
    zoom(delta) {
      camera.position.z = THREE.MathUtils.clamp(
        camera.position.z - delta * 10,
        3,
        15
      );
    },
    reset() {
      molecule.rotation.set(0, 0, 0);
      camera.position.z = 7;
    }
  };
}
