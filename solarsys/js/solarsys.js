import * as THREE from '/node_modules/three/build/three.module.js';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GUI} from '/node_modules/dat.gui/build/dat.gui.module.js';

const CAMERA_FOV = 40;
const CAMERA_ASPECT = 2;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1000;

const DEBUG = false;

function main() {
    const canvas = document.getElementById("solarsys");
    const renderer = new THREE.WebGLRenderer({canvas});
    const gui = new GUI();

    class AxisGridHelper {
        constructor(node, units = 10) {
          const axes = new THREE.AxesHelper();
          axes.material.depthTest = false;
          axes.renderOrder = 2;  
          node.add(axes);
       
          const grid = new THREE.GridHelper(units, units);
          grid.material.depthTest = false;
          grid.renderOrder = 1;
          node.add(grid);
       
          this.grid = grid;
          this.axes = axes;
          this.visible = false;
        }
        get visible() {
          return this._visible;
        }
        set visible(v) {
          this._visible = v;
          this.grid.visible = v;
          this.axes.visible = v;
        }
      }
    
    function makeAxisGrid(node, label, units) {
        const helper = new AxisGridHelper(node, units);
        gui.add(helper, 'visible').name(label);
    }

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

            // cast a ray through the frustum
            this.raycaster.setFromCamera(position, camera);
            // get the list of objects the ray intersected
            const intersectedObjects = this.raycaster.intersectObjects(bodies);
            if (intersectedObjects.length) {
                // pick the first object. It's the closest one
                this.pickedObject = intersectedObjects[0].object;
                // save its color
                this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                // set its emissive color to flashing red/yellow
                this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);         
                if(DEBUG) {
                    console.log("Object picked");
                }
            }
        }
    }

    const scene = new THREE.Scene();
    const bodies = [];

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR);
    camera.position.set(0, 0, 50);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, renderer.domElement);

    const cameraStick = new THREE.Object3D();
    scene.add(cameraStick);
    cameraStick.add(camera);

    const radius = 1;
    const segments = 16;

    const solarSys = new THREE.Object3D();
    scene.add(solarSys);
    bodies.push(solarSys);

    const sun = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshPhongMaterial({emissive: 0xFFFF00}), [0, 0, -(CAMERA_FAR / 2)]);
    sun.scale.set(5, 5, 5);
    solarSys.add(sun);
    bodies.push(sun);

    const earthOrbit = new THREE.Object3D();
    earthOrbit.position.x = 10;
    solarSys.add(earthOrbit);
    bodies.push(earthOrbit);

    const earth = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244}));
    earthOrbit.add(earth);
    bodies.push(earth);

    const moonOrbit = new THREE.Object3D();
    moonOrbit.position.x = 2;
    earthOrbit.add(moonOrbit);

    const moon = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), new THREE.MeshPhongMaterial({color: 0x888888, emissive: 0x222222}));
    moon.scale.set(.5, .5, .5);
    moonOrbit.add(moon);
    bodies.push(moon);

    const color = 0xFFFFFF;
    const intensity = 3;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);

    makeAxisGrid(solarSys, 'solarSys', 25);
    makeAxisGrid(sun, 'sun');
    makeAxisGrid(earthOrbit, 'earthOrbit');
    makeAxisGrid(earth, 'earth');
    makeAxisGrid(moonOrbit, 'moonOrbit');
    makeAxisGrid(moon, 'moon');

    bodies.forEach((node) => {
        const axes = new THREE.AxesHelper();
        axes.material.depthTest = false;
        axes.renderOrder = 1;
        node.add(axes);
    })

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

    const pickPosition = {x: 0, y: 0};
    const pickHelper = new PickHelper();
    clearPickPosition();

    function render(time) {
        time *= 0.001;

        if(resizeCanvas()) {
            camera.getCamera().aspect = canvas.clientWidth / canvas.clientHeight;
            camera.getCamera().updateProjectionMatrix();
        }

        bodies.forEach((obj) => {
            obj.rotation.y = time;
        });

        pickHelper.pick(pickPosition, scene, camera, time);

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width  / rect.width,
          y: (event.clientY - rect.top ) * canvas.height / rect.height,
        };
      }
    
      function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1; 
        if(DEBUG) {
            console.log(`pickPosition.x: ${pickPosition.x}\npickPosition.y: ${pickPosition.y}`)
        }
      }
    
      function clearPickPosition() {
        pickPosition.x = -100000;
        pickPosition.y = -100000;
      }
      window.addEventListener('mousemove', setPickPosition);
      window.addEventListener('mouseout', clearPickPosition);
      window.addEventListener('mouseleave', clearPickPosition);
    
      window.addEventListener('touchstart', (event) => {
        // prevent the window from scrolling
        event.preventDefault();
        setPickPosition(event.touches[0]);
      }, {passive: false});
    
      window.addEventListener('touchmove', (event) => {
        setPickPosition(event.touches[0]);
      });
    
      window.addEventListener('touchend', clearPickPosition);
}

main();