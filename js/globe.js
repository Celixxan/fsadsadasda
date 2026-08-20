let THREE;

export async function createGlobe({ canvas, stage, fallback, countries, onSelect }) {
  try {
    THREE = await import("https://cdn.jsdelivr.net/npm/three@0.185.1/+esm");
  } catch (error) {
    fallback.hidden = false;
    fallback.querySelector("p").textContent = "3D-kloden kunne ikke lastes. Resten av Verdensbordet fungerer fortsatt.";
    console.warn("Three.js failed to load", error);
    return { focus: () => {}, spin: () => {}, setPaused: () => {}, destroy: () => {} };
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    fallback.hidden = false;
    fallback.querySelector("p").textContent = "WebGL er ikke tilgjengelig på denne enheten.";
    return { focus: () => {}, spin: () => {}, setPaused: () => {}, destroy: () => {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 4.35);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1, 96, 96),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0b1115"),
      roughness: 0.6,
      metalness: 0.28,
      clearcoat: 0.22,
      transparent: true,
      opacity: 0.98,
    }),
  );
  globeGroup.add(globe);

  const grid = new THREE.Mesh(
    new THREE.SphereGeometry(1.006, 36, 36),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#839091"), wireframe: true, transparent: true, opacity: 0.085 }),
  );
  globeGroup.add(grid);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 72, 72),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { glowColor: { value: new THREE.Color("#d8ff63") } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vView = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vView), 3.3);
          gl_FragColor = vec4(glowColor, max(0.0, intensity) * 0.5);
        }
      `,
    }),
  );
  globeGroup.add(atmosphere);

  const pointCount = 2600;
  const positions = new Float32Array(pointCount * 3);
  for (let index = 0; index < pointCount; index += 1) {
    const y = 1 - (index / (pointCount - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    positions[index * 3] = Math.cos(theta) * radius * 1.003;
    positions[index * 3 + 1] = y * 1.003;
    positions[index * 3 + 2] = Math.sin(theta) * radius * 1.003;
  }
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  globeGroup.add(new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: "#a8b3b2", size: 0.0075, transparent: true, opacity: 0.15, depthWrite: false })));

  const latLonToVector3 = (lat, lon, radius = 1) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  };

  const markerGeometry = new THREE.SphereGeometry(0.016, 9, 9);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: "#e6ece8", transparent: true, opacity: 0.68 });
  const markers = new THREE.InstancedMesh(markerGeometry, markerMaterial, countries.length);
  markers.userData.countries = countries;
  const dummy = new THREE.Object3D();
  countries.forEach((country, index) => {
    dummy.position.copy(latLonToVector3(country.lat, country.lon, 1.015));
    dummy.updateMatrix();
    markers.setMatrixAt(index, dummy.matrix);
  });
  globeGroup.add(markers);

  const selectedMarker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 18, 18), new THREE.MeshBasicMaterial({ color: "#d8ff63" }));
  selectedMarker.visible = false;
  globeGroup.add(selectedMarker);

  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.043, 0.052, 48),
    new THREE.MeshBasicMaterial({ color: "#d8ff63", transparent: true, opacity: 0.76, side: THREE.DoubleSide, depthWrite: false }),
  );
  selectedRing.visible = false;
  globeGroup.add(selectedRing);

  const starCount = 1500;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    const radius = 5 + Math.random() * 11;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[index * 3 + 1] = radius * Math.cos(phi);
    starPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.38, depthWrite: false }));
  scene.add(stars);

  scene.add(new THREE.AmbientLight(0x8ba0aa, 1.1));
  const key = new THREE.DirectionalLight(0xe8fff5, 2.9);
  key.position.set(-2, 2.5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8ff63, 2.1);
  rim.position.set(3, -1, -2);
  scene.add(rim);

  let routeLine = null;
  let targetQuaternion = new THREE.Quaternion();
  let currentCountry = null;
  let dragging = false;
  let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spinBoost = 0;
  let previousPointer = { x: 0, y: 0 };
  let pointerParallax = { x: 0, y: 0 };
  let frame;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function focus(country) {
    if (!country) return;
    currentCountry = country;
    const position = latLonToVector3(country.lat, country.lon, 1.02);
    selectedMarker.position.copy(position);
    selectedMarker.visible = true;
    selectedRing.position.copy(position.clone().multiplyScalar(1.006));
    selectedRing.lookAt(new THREE.Vector3(0, 0, 0));
    selectedRing.rotateY(Math.PI);
    selectedRing.visible = true;

    const sourceDirection = position.clone().normalize();
    targetQuaternion = new THREE.Quaternion().setFromUnitVectors(sourceDirection, new THREE.Vector3(0.15, 0.04, 0.987).normalize());

    if (routeLine) {
      globeGroup.remove(routeLine);
      routeLine.geometry.dispose();
      routeLine.material.dispose();
    }
    const origin = latLonToVector3(59.91, 10.75, 1.026);
    const destination = position.clone();
    const mid = origin.clone().add(destination).multiplyScalar(0.5).normalize().multiplyScalar(1.34 + origin.distanceTo(destination) * 0.13);
    const curve = new THREE.QuadraticBezierCurve3(origin, mid, destination);
    routeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(90)),
      new THREE.LineBasicMaterial({ color: "#d8ff63", transparent: true, opacity: 0.58 }),
    );
    globeGroup.add(routeLine);
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    if (!paused) {
      if (!dragging) {
        const autoQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0012 + spinBoost);
        targetQuaternion.premultiply(autoQuaternion);
        spinBoost *= 0.965;
      }
      globeGroup.quaternion.slerp(targetQuaternion, currentCountry ? 0.055 : 0.03);
      stars.rotation.y = elapsed * 0.006;
      stars.rotation.x = Math.sin(elapsed * 0.08) * 0.03;
      if (selectedRing.visible) {
        selectedRing.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.22);
        selectedRing.material.opacity = 0.55 + Math.sin(elapsed * 3.2) * 0.2;
      }
      camera.position.x += pointerParallax.x * 0.12 * 0.035 - camera.position.x * 0.035;
      camera.position.y += pointerParallax.y * 0.09 * 0.035 - camera.position.y * 0.035;
      camera.lookAt(0, 0, 0);
    }
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return rect;
  }

  function handlePointerDown(event) {
    dragging = true;
    previousPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    const rect = pointerPosition(event);
    pointerParallax.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointerParallax.y = -((event.clientY - rect.top) / rect.height - 0.5);
    if (!dragging || paused) return;
    const deltaX = event.clientX - previousPointer.x;
    const deltaY = event.clientY - previousPointer.y;
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * 0.005);
    const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * 0.004);
    targetQuaternion.premultiply(yaw).premultiply(pitch).normalize();
    previousPointer = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event) {
    const moved = Math.hypot(event.clientX - previousPointer.x, event.clientY - previousPointer.y);
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (moved > 7) return;
    pointerPosition(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(markers)[0];
    if (hit?.instanceId != null) onSelect?.(countries[hit.instanceId]);
  }

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", () => { pointerParallax = { x: 0, y: 0 }; });
  window.addEventListener("resize", resize);

  fallback.hidden = true;
  resize();
  animate();

  return {
    focus,
    spin(amount = 0.06) { spinBoost = Math.max(spinBoost, amount); },
    setPaused(value) { paused = value; },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      renderer.dispose();
    },
  };
}
