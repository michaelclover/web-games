import * as THREE from '/node_modules/three/build/three.module.js';
//import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GUI} from '/node_modules/dat.gui/build/dat.gui.module.js';

const CAMERA_FOV = 40;
const CAMERA_ASPECT = 2;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

let cometSpawn = { rate: 10 };
let numberOfComets = 0;
let cometsClicked = 0;

const DEBUG = false;

function main() {
    // create canvas and renderer and append to our DOM.
    const canvas = document.getElementById("cometclicker");
    const renderer = new THREE.WebGLRenderer({canvas});
    document.body.append(renderer.domElement);

    // helper UI class to modify spawned comet colours.
    class ColourUIHelper {
      constructor(object) {
        this.object = object;
      }

      get colour() {
        return `#${this.object.material['color'].getHexString()}`;
      }

      set colour(hex) {
        this.object.material['color'].set(hex);
      }
    }

    const gui = new GUI();
    gui.domElement.id = 'gui';

    // helper class to receive relative pick coordinates and check for ray intersections with comets.
    class PickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
        }

        pick(position, scene, camera, time) {
            if(this.pickedObject) {
                this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                this.pickedObject = undefined;
            }

            // cast a ray through the camera frustum.
            this.raycaster.setFromCamera(position, camera);
            // contains list of objects our ray intersected.
            const intersectedObjects = this.raycaster.intersectObjects(comets);
            if (intersectedObjects.length) {
                // first picked object is the closest one.
                this.pickedObject = intersectedObjects[0].object;
                this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                this.pickedObject.material.emissive.setHex(0xFFFFFF);         
                if(DEBUG) {
                    console.log("Object picked");
                }
            }
        }

        getPickedObject() {
          return this.pickedObject;
        }
    }

    const scene = new THREE.Scene();

    // create a perspective camera for our scene.
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(0, 0, 50);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    //const controls = new OrbitControls(camera, renderer.domElement);
    scene.add(camera);

    const cameraStick = new THREE.Object3D();
    scene.add(cameraStick);
    cameraStick.add(camera);

    // create the earth mesh.
    const earthMesh = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshPhongMaterial({color: 0xFFFFFF}));
    // texture courtesy of James Hastings-Trew, available from http://planetpixelemporium.com/planets.html.
    earthMesh.material.map = new THREE.TextureLoader().load('./assets/earthmap1k.jpg');
    scene.add(earthMesh);

    // create ambient lighting for our scene.
    const light = new THREE.AmbientLight(0xFFFFFF, 1);
    light.position.z = 10;
    scene.add(light);

    // to store comet instances for update.
    const comets = [];

    // create a comet mesh to store the properties we will clone for new comet instances, and that we can bind to UI controls.
    let cometMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshPhongMaterial({color: 0x3D3D3D}));
    gui.addColor(new ColourUIHelper(cometMesh), 'colour').name('comet-colour');
    gui.add(cometSpawn, 'rate').min(10).max(100).step(10).name('spawn-rate');

    // resizes the renderer relative to the new browser window size.
    function resizeCanvas() {
        const pixelRatio = window.devicePixelRatio;
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if(needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    resizeCanvas();

    // to keep our pick position.
    const pickPosition = {x: 0, y: 0};
    const pickHelper = new PickHelper();
    clearPickPosition();

    // update and render loop.
    function render(time) {
        // get the time in seconds.
        time *= 0.001;

        // check to see if we've resized and need to update our camera perspective.
        if(resizeCanvas()) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // roll the dice to see whether we need to spawn another comet.
        if(Math.floor(Math.random() * Math.floor(cometSpawn.rate)) === 1) {
          if(DEBUG) {
            console.log("comet spawned");
          }
          let newCometMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshPhongMaterial({color: cometMesh.material.color}))
          newCometMesh.position.x = 20;
          newCometMesh.position.y = 0;
          newCometMesh.position.z = 0;
          newCometMesh.name = numberOfComets.toString();
          numberOfComets = numberOfComets + 1;
          scene.add(newCometMesh);
          comets.push(newCometMesh);
        }

        earthMesh.rotation.y = time * 0.2;
        comets.forEach((obj) => {
            // move towards the earth.
            // TODO: implement logic to move object towards earth at random.
            obj.position.x -= 0.1;

            // check if a comet intersects with earth.
            if(earthMesh.position.distanceTo(obj.position) <= 7) {
              // TODO: kill the scene and display score achieved in the centre of screen.
              //scene.remove.apply(scene, scene.children);
            }
        })

        pickHelper.pick(pickPosition, scene, camera, time);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // given a set of mouse click coordinates, returns the relative click position on the canvas.
    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width  / rect.width,
          y: (event.clientY - rect.top ) * canvas.height / rect.height,
        };
      }
    
      // sets the pick position relative to the canvas window.
      function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1; 
        if(DEBUG) {
            console.log(`pickPosition.x: ${pickPosition.x}\npickPosition.y: ${pickPosition.y}`)
        }
      }
    
      // clear the pick position to some garbage values where nothing exists to intersect.
      function clearPickPosition() {
        pickPosition.x = -100000;
        pickPosition.y = -100000;
      }

      // check to see if there is a comet object that has been clicked to destroy.
      function setPickClicked() {
        let lastPickedObject = pickHelper.getPickedObject();
        if(lastPickedObject !== undefined && lastPickedObject !== null) {
          let objectFromScene = scene.getObjectByName(lastPickedObject.name);
          if(objectFromScene !== undefined && lastPickedObject !== null) {
            scene.remove(objectFromScene);
            for(let i = 0; i < comets.length; i++) {
              if(comets[i].name === objectFromScene.name) {
                if(DEBUG) {
                  console.log("comet removed from scene");
                }
                comets.splice(i, 1);
                cometsClicked = cometsClicked + 1;
                document.getElementById("cometsclicked").textContent = `comets clicked: ${cometsClicked}`;
                break;
              }
            }
          }
        }
      }

      // add listeners for mouse movement events.
      window.addEventListener('mousemove', setPickPosition);
      window.addEventListener('mouseout', clearPickPosition);
      window.addEventListener('mouseleave', clearPickPosition);
      window.addEventListener('mousedown', setPickClicked);
}

main();