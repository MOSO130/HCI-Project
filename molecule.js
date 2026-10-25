
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

  const oxygen = new THREE.Vector3(0, 0.5, 0);
  const hydrogen1 = new THREE.Vector3(-1.1, -0.5, 0);
  const hydrogen2 = new THREE.Vector3(1.1, -0.5, 0);

  bond(oxygen, hydrogen1);
  bond(oxygen, hydrogen2);

  atom(0.55, 0xff3333, ...oxygen.toArray());
  atom(0.35, 0xffffff, ...hydrogen1.toArray());
  atom(0.35, 0xffffff, ...hydrogen2.toArray());

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
