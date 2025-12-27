const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // cam position

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c0c0c0'); // background color

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const light = new THREE.AmbientLight(0xFFFFFF, 0.4); // soft white light
light.position.set(5, 5, 5);
scene.add(light);

const wireframeMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffffff,  // white
  wireframe: true 
});

// Directional light for clearer, matte face shading
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(3, 5, 2);
scene.add(dirLight);

// Parameters for the dodecahedron
const params = {
  radius: 2,
  detail: 0
};

let geometry = new THREE.DodecahedronGeometry(params.radius, params.detail);


// Material with matte panels
const material = new THREE.MeshLambertMaterial({ color: '#3b234a', flatShading: true,
  transparent: true, opacity: 0.8});
const dodecahedron = new THREE.Mesh(geometry, material);
scene.add(dodecahedron);

// Add thin white wireframe edges
const edges = new THREE.EdgesGeometry(geometry);
const edgeLines = new THREE.LineSegments(
  edges,
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
dodecahedron.add(edgeLines);

const wireframeModel = new THREE.Mesh(geometry, wireframeMaterial);
dodecahedron.add(wireframeModel);

// Create the GUI with sliders
// shape changes added into the .add
const gui = new lil.GUI({ width: 180, title: 'Controls' });
gui.close();

gui.domElement.style.position = 'absolute';
gui.domElement.style.right = '0px';


// Make GUI less obstructive: fade until hover
gui.domElement.style.opacity = '0.3';
gui.domElement.style.transition = 'opacity 150ms ease-in-out';
gui.domElement.addEventListener('mouseenter', () => {
  gui.domElement.style.opacity = '1';
});
gui.domElement.addEventListener('mouseleave', () => {
  gui.domElement.style.opacity = '0.3';
});


gui.add(params, 'radius', 1, 3).onChange(() => {
  geometry.dispose();
  geometry = new THREE.DodecahedronGeometry(params.radius, params.detail);
  dodecahedron.geometry = geometry;
  
  edgeLines.geometry.dispose();
  edgeLines.geometry = new THREE.EdgesGeometry(geometry);
  
  wireframeModel.geometry.dispose();
  wireframeModel.geometry = geometry;
});

gui.add(params, 'detail', 0, 5, 1).onChange(() => {
  geometry.dispose();
  geometry = new THREE.DodecahedronGeometry(params.radius, params.detail);
  dodecahedron.geometry = geometry;
  
  edgeLines.geometry.dispose();
  edgeLines.geometry = new THREE.EdgesGeometry(geometry);
  
  wireframeModel.geometry.dispose();
  wireframeModel.geometry = geometry;
});

function animate() {
  requestAnimationFrame(animate);
  dodecahedron.rotation.y += 0.005;
  dodecahedron.rotation.x += 0.005;
  renderer.render(scene, camera);
}

animate();



