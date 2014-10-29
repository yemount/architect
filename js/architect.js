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
      this.minCoord.x = parseFloat(strs[2]);
      this.maxCoord.x = parseFloat(strs[3]);
    } else if (hasPrefix(classname, 'archi-y-')) {
      var strs = classname.split('-');
      this.minCoord.y = parseFloat(strs[2]);
      this.maxCoord.y = parseFloat(strs[3]);
    }
  }
  this.minCoord.z = 500;
  this.maxCoord.z = 500;
}

ArchiDom.prototype.getHelixCoord = function() {
  var archiToEucCoord = function (x, y , z) {
    var depth = z;
    var height = 0 * ArchiDom.strideY; // TODO
    var theta = -(x - ArchiDom.numStepsX / 2) * ArchiDom.strideX * Math.PI / 180;
    return new THREE.Vector3(depth * Math.sin(theta), height, depth * Math.cos(theta));
  }

  var v1 = archiToEucCoord(this.minCoord.x, this.minCoord.y, this.minCoord.z);
  var v2 = archiToEucCoord(this.maxCoord.x, this.minCoord.y, this.minCoord.z);

  this.eucCoord = new THREE.Vector3().addVectors(v1, v2).divideScalar(2);
  this.eucLength = new THREE.Vector3().subVectors(v2, v1).length();
}

ArchiDom.prototype.transform = function(obj) {
  obj.position.x = this.eucCoord.x;
  obj.position.y = this.eucCoord.y;
  obj.position.z = this.eucCoord.z;

  var facing = new THREE.Vector3();
  facing.x = 0;
  facing.y = this.eucCoord.y;
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