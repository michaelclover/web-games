import * as THREE from '/node_modules/three/build/three.module.js';
import {OrbitControls} from '/node_modules/three/examples/jsm/controls/OrbitControls.js';

const CAMERA_FOV = 75;
const CAMERA_ASPECT = 2;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
const CAMERA_XYZ = [0, 0, 2];

class System {
    constructor() {
        this.scene = new THREE.Scene();
    }

    update() {

    }

    render() {

    }
}

class Body extends THREE.Mesh {
    constructor(geometry, material, xyz) {
        super(geometry, material)
        if(xyz.length !== 0) {
            this.position.x = xyz[0];
            this.position.y = xyz[1];
            this.position.z = xyz[2];
        }
        else {
            this.position.x = 0;
            this.position.y = 0;
            this.position.z = 0;    
        }
    }
}

class PerspectiveCamera {
    constructor(fov, aspect, near, far, xyz) {
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.x = xyz[0];
        this.camera.position.y = xyz[1];
        this.camera.position.z = xyz[2];
    }

    getCamera() {
        return this.camera;
    }
}

function main() {
    const canvas = document.getElementById("solarsys");
    const renderer = new THREE.WebGLRenderer({canvas});

    const scene = new THREE.Scene();
    const camera = new PerspectiveCamera(CAMERA_FOV, CAMERA_ASPECT, CAMERA_NEAR, CAMERA_FAR, CAMERA_XYZ);

    let sun = new Body(new THREE.SphereGeometry(5, 32, 32), new THREE.MeshBasicMaterial({color: 0xff0000}), [0, 0, -(CAMERA_FAR / 2)]);
    scene.add(sun);
    
    const controls = new OrbitControls(camera.getCamera(), renderer.domElement);

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

    function render(time) {
        time *= 0.001;

        if(resizeCanvas()) {
            camera.getCamera().aspect = canvas.clientWidth / canvas.clientHeight;
            camera.getCamera().updateProjectionMatrix();
        }

        sun.rotation.x += 0.1;
        sun.rotation.y += 0.1;

        renderer.render(scene, camera.getCamera());

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();