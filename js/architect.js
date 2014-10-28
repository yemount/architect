var camera, sceneL, sceneR, cssRendererL, cssRendererR;
var effect, controls;
var element, container;

var watchingObjects = [];

var statDiv = document.getElementById('stat');

var clock = new THREE.Clock();

// String utils

function hasPrefix(str, prefix) {
  return str.indexOf(prefix) == 0;
}

// Architect code

var ArchiDom = function(dom){
  this.dom = dom;
  this.dom.style.position = 'absolute';
  this.getArchiCoord();
  this.getHelixCoord();
}

ArchiDom.prototype.getArchiCoord = function() {
  this.minCoord = new THREE.Vector3();
  this.maxCoord = new THREE.Vector3();
  for(var i = 0; i < this.dom.classList.length; i++) {
    var classname = this.dom.classList[i];
    if(hasPrefix(classname, 'archi-x-')) {
      var strs = classname.split('-');
      this.minCoord.x = parseInt(strs[2]);
      this.maxCoord.x = parseInt(strs[3]);
    } else if (hasPrefix(classname, 'archi-y-')) {
      var strs = classname.split('-');
      this.minCoord.y = parseInt(strs[2]);
      this.maxCoord.y = parseInt(strs[3]);
    }
  }
}

ArchiDom.prototype.getHelixCoord = function() {
  this.eucCoord = new THREE.Vector3();
  // theta
  this.eucCoord.x = ((this.minCoord.x + this.maxCoord.x) / 2 - ArchiDom.numStepsX / 2) * ArchiDom.strideX;
  // height
  this.eucCoord.y = ((this.minCoord.y + this.maxCoord.y) / 2 - ArchiDom.numStepsY / 2) * ArchiDom.strideY;
  // depth
  this.eucCoord.z = 5000;
}

function setHelixPosition(object, height, angle, radius) {

  var phi = angle * Math.PI / 180;

  object.position.x = radius * Math.sin( phi );
  object.position.y = height;
  object.position.z = radius * Math.cos( phi );

  var vector = new THREE.Vector3();
  vector.x = 0;
  vector.y = object.position.y;
  vector.z = 0;

  object.lookAt( vector );
}

ArchiDom.prototype.transform = function(obj) {
  stat.innerHTML = this.eucCoord.x + " " + this.eucCoord.y + " " + this.eucCoord.z;
  var theta = this.eucCoord.x;
  var height = this.eucCoord.y;

  obj.position.x = this.eucCoord.z * Math.sin(theta);
  obj.position.y = height;
  obj.position.z = this.eucCoord.z * Math.cos(theta);

  var facing = new THREE.Vector3();
  facing.x = 0;
  facing.y = height;
  facing.z = 0;

  obj.lookAt(facing);
}

ArchiDom.prototype.addToScene = function(sceneL, sceneR) {
  this.cssObjL = new THREE.CSS3DObject(this.dom.cloneNode(true));
  this.cssObjR = new THREE.CSS3DObject(this.dom.cloneNode(true));
  sceneL.add(this.cssObjL);
  sceneR.add(this.cssObjR);
  this.transform(this.cssObjL);
  this.transform(this.cssObjR);
  this.dom.remove();
}

ArchiDom.setupWorld = function() {
  this.strideY = 100;
  this.strideZ = 100;
  this.strideX = 15;
  this.numStepsY = 12;
  this.numStepsX = 12;
  this.numStepsZ = 12;
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

function findArchiDomsRecursive(root) {
  var results = [];
  for(var i = 0; i < root.children.length; i++) {
    var child = root.children[i];
      for(var j = 0; j < child.classList.length; j++) {
        if(hasPrefix(child.classList[j], 'archi-')) {
          results.push(new ArchiDom(child));
          break;
        }
      }
      results.concat(findArchiDomsRecursive(child));
  }
  return results;
}

function initHtmlPages() {
  // set page background to black
  document.body.style.backgroundColor = "black";

  // iterate through descendents to find top level DOMs with architect classname
  var archiDoms = findArchiDomsRecursive(document.body);
  for(var i = 0; i < archiDoms.length; i++) {
    archiDoms[i].addToScene(sceneL, sceneR);
  }
}

function init() {
  
  sceneL = new THREE.Scene();
  sceneR = new THREE.Scene();
  initCssRenderer();
  ArchiDom.setupWorld();

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

init();
animate();