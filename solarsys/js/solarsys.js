import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';

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

class Body {
    constructor(geometry, material, xyz) {
        this.mesh = new THREE.Mesh(geometry, material);
        if(xyz.length !== 0) {
            this.mesh.position.x = xyz[0];
            this.mesh.position.y = xyz[1];
            this.mesh.position.z = xyz[2];
        }
        else {
            this.mesh.position.x = 0;
            this.mesh.position.y = 0;
            this.mesh.position.z = 0;    
        }
    }

    getMesh() {
        return this.mesh;
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
    scene.add(sun.getMesh());
    
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

        sun.getMesh().rotation.x += 0.1;
        sun.getMesh().rotation.y += 0.1;

        renderer.render(scene, camera.getCamera());

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();