import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Stats from "three/examples/jsm/libs/stats.module"
import { prng_alea } from 'esm-seedrandom';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load('textures/1.png')

/**
 * Galaxy
 */
const parameters = {}
parameters.seed = 10000
parameters.count = 4.6
parameters.radius = 5
parameters.radiusPower = 2.8
parameters.branches = 8
parameters.spin = 0.65
parameters.spread = 3
parameters.spreadPower = 1.21
parameters.insideColor = '#f0af55'
parameters.outsideColor = '#0245bb'
parameters.colorExp = 0.7

const geometry = new THREE.BufferGeometry()

const seed = (seed) => {
    return () => {
        seed = Math.sin(seed) * 10000;
        return seed - Math.floor(seed);
    }
}

const setAttributes = () => {
    const count = Math.round(Math.pow(10, parameters.count))
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const random = prng_alea(parameters.seed);

    const insideColor = new THREE.Color(parameters.insideColor);
    const outsideColor = new THREE.Color(parameters.outsideColor);

    for (let i = 0; i < count; i++) {
        
        const branch = i % parameters.branches
        const branchAngle = (branch / parameters.branches) * Math.PI * 2
        
        const radius = Math.pow(random(), parameters.radiusPower) * parameters.radius
        const spinAngle = parameters.spin * Math.PI * 2 * radius / parameters.radius

        const spread = Math.pow(random(), parameters.spreadPower) * parameters.spread
        const spreadRadius = spread * radius / parameters.radius
        const spreadAngle = random() * Math.PI * 2
        const spreadSpinAngle = Math.acos((Math.cos(spreadAngle) * spreadRadius) / radius)

        positions[i * 3 + 0] = radius * Math.cos(branchAngle + spinAngle + spreadSpinAngle)
        positions[i * 3 + 1] = spreadRadius * Math.sin(spreadAngle)
        positions[i * 3 + 2] = radius * Math.sin(branchAngle + spinAngle + spreadSpinAngle)

        const mixedColor = new THREE.Color()
        const lerp = (radius / parameters.radius) * parameters.colorExp + random() * (1 - parameters.colorExp)
        mixedColor.lerpColors(insideColor, outsideColor, lerp)

        colors[i * 3 + 0] = mixedColor.r
        colors[i * 3 + 1] = mixedColor.g
        colors[i * 3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}
setAttributes()

const material = new THREE.PointsMaterial()
material.vertexColors = true
material.alphaMap = particleTexture
material.transparent = true
material.size = 0.03
material.sizeAttenuation = true
material.depthWrite = false
material.blending = THREE.AdditiveBlending

const points = new THREE.Points(geometry, material)
points.position.x = 0
points.position.y = 0.5
points.position.z = -4
scene.add(points)

gui.addColor(parameters, 'insideColor').onChange(setAttributes)
gui.addColor(parameters, 'outsideColor').onChange(setAttributes)
gui.add(parameters, 'seed').min(10000).max(99999).step(1).onChange(setAttributes);
gui.add(parameters, 'count').min(3).max(6).step(0.1).onChange(setAttributes).name('count (10^x)')
gui.add(parameters, 'radius').min(0.1).max(10).step(0.01).onChange(setAttributes)
gui.add(parameters, 'radiusPower').min(1).max(10).step(0.01).onChange(setAttributes)
gui.add(parameters, 'branches').min(2).max(10).step(1).onChange(setAttributes)
gui.add(parameters, 'spin').min(0).max(1).step(0.001).onChange(setAttributes)
gui.add(parameters, 'spread').min(0).max(10).step(0.001).onChange(setAttributes)
gui.add(parameters, 'spreadPower').min(1).max(2).step(0.01).onChange(setAttributes)
gui.add(parameters, 'colorExp').min(0).max(1).step(0.01).onChange(setAttributes)
gui.add(material, 'size').min(0.001).max(0.05).step(0.001)



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 2
camera.position.z = 0
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(points.position.x, points.position.y, points.position.z)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.xr.enabled = true;

const stats = Stats()
document.body.appendChild(stats.dom)
document.body.appendChild( VRButton.createButton( renderer ) );

/**
 * Animate
 */
const clock = new THREE.Clock()

renderer.setAnimationLoop(() => {
    const elapsedTime = clock.getElapsedTime()
    points.rotation.y = elapsedTime * 0.02

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)
    stats.update()
});
