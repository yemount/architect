var camera, sceneL, sceneR, cssRendererL, cssRendererR;
var effect, controls;
var element, container;

var watchingObjects = [];

// var testingMesh, testingGeo;

var clock = new THREE.Clock();

init();
animate();

function setHelixPosition(object, height, angle, radius) {

  var phi = angle * Math.PI / 180;

  object.position.x = radius * Math.sin( phi );
  object.position.y = height;
  object.position.z = radius * Math.cos( phi );

  var vector = new THREE.Vector3();
  vector.x = 0;//object.position.x * 2;
  vector.y = object.position.y;
  vector.z = 0;//object.position.z * 2;

  object.lookAt( vector );
}

function initCssRenderer() {
  container = document.createElement('div');
  container.style.width = window.innerWidth + 'px';
  container.style.height = window.innerHeight + 'px';
  document.body.appendChild(container);

  cssRendererL = new THREE.CSS3DRenderer();
  cssRendererL.setSize( window.innerWidth/2, window.innerHeight );
  cssRendererL.domElement.style.position = 'absolute';
  cssRendererL.domElement.style.left = '0px';
  cssRendererL.domElement.style.top = '0px';
  container.appendChild( cssRendererL.domElement );

  cssRendererR = new THREE.CSS3DRenderer();
  cssRendererR.setSize( window.innerWidth/2, window.innerHeight );
  cssRendererR.domElement.style.position = 'absolute';
  cssRendererR.domElement.style.left = window.innerWidth/2 + 'px';
  cssRendererR.domElement.style.top = '0px';
  container.appendChild( cssRendererR.domElement );
}

function addToScene(dom, transform) {
  var L = new THREE.CSS3DObject(dom.cloneNode(true));
  var R = new THREE.CSS3DObject(dom.cloneNode(true));
  sceneL.add(L);
  sceneR.add(R);
  transform(L);
  transform(R);
  dom.remove();
}

function initHtmlPages() {
  document.body.style.backgroundColor = "black";

  addToScene(document.getElementById("block1"), function(obj) {
    obj.scale.x = 3;
    obj.scale.y = 3;
    obj.scale.z = 3;
    setHelixPosition(obj, -100, 0, 1200);
    obj.lookAt(new THREE.Vector3());
  })
}

function init() {
  
  sceneL = new THREE.Scene();
  sceneR = new THREE.Scene();
  initCssRenderer();

  camera = new THREE.PerspectiveCamera(90, 1, 0.001, 10000);
  camera.position.set(0, 0, 0);

  sceneL.add(camera);
  sceneR.add(camera);

  controls = new THREE.OrbitControls(camera, element);
  controls.target.set(
    0+Math.sin(Math.PI * 0 / 180)*1,
    0,
    0+Math.cos(Math.PI * 0 / 180)*1
  );
  controls.noZoom = true;
  controls.noPan = true;

  function setOrientationControls(e) {
    if (!e.alpha) {
      return;
    }

    controls = new THREE.DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();

    container.addEventListener('click', fullscreen, false);

    window.removeEventListener('deviceorientation', setOrientationControls);
  }
  window.addEventListener('deviceorientation', setOrientationControls, true);


  var light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
  sceneL.add(light);
  sceneR.add(light);


  initHtmlPages();
  effect = new THREE.StereoEffect(cssRendererL, cssRendererR);

  window.addEventListener('resize', resize, false);
  setTimeout(resize, 1);

}

function resize() {
  var width = container.offsetWidth;
  var height = container.offsetHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  //webGlRenderer.setSize(width, height);
  effect.setSize(width, height);
}

function update(dt) {
  resize();

  camera.updateProjectionMatrix();
  controls.update(dt);
}

function render(dt) {
  effect.render(sceneL, sceneR, camera);
}

function animate(t) {
  requestAnimationFrame(animate);

  update(clock.getDelta());
  render(clock.getDelta());
}

function fullscreen() {
  // var _container = document.getElementById('example');
  // if (_container.requestFullscreen) {
  //   _container.requestFullscreen();
  // } else if (_container.msRequestFullscreen) {
  //   _container.msRequestFullscreen();
  // } else if (_container.mozRequestFullScreen) {
  //   _container.mozRequestFullScreen();
  // } else if (_container.webkitRequestFullscreen) {
  //   _container.webkitRequestFullscreen();
  // }
}