import { useEffect, useRef } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

function createJaw(upper: boolean, toothMaterial: THREE.Material, shellMaterial: THREE.Material) {
  const jaw = new THREE.Group()
  const shellGeometry = new RoundedBoxGeometry(4.5, 0.8, 1.24, 8, 0.28)
  const positions = shellGeometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const arch = 1 - Math.pow(positions.getX(i) / 2.25, 2)
    positions.setZ(i, positions.getZ(i) + arch * 0.28)
  }
  shellGeometry.computeVertexNormals()
  const shell = new THREE.Mesh(shellGeometry, shellMaterial)
  shell.position.set(0, upper ? 0.78 : -0.78, 0.34)
  jaw.add(shell)

  const toothGeometry = new RoundedBoxGeometry(0.46, 0.72, 0.38, 7, 0.17)
  const count = 11

  for (let index = 0; index < count; index += 1) {
    const amount = index / (count - 1)
    const normalized = amount * 2 - 1
    const angle = normalized * 1.04
    const side = Math.abs(normalized)
    const canine = upper && (index === 2 || index === 8)
    const tooth = new THREE.Mesh(canine ? new THREE.ConeGeometry(0.24, 0.95, 40) : toothGeometry, toothMaterial)

    tooth.position.set(
      Math.sin(angle) * 2.02,
      upper ? 0.34 : -0.34,
      0.72 + Math.cos(angle) * 0.52,
    )
    tooth.rotation.y = -angle * 0.92
    tooth.rotation.z = upper ? normalized * 0.025 : -normalized * 0.025
    tooth.scale.set(0.9 - side * 0.22, canine ? 1 : 0.88 - side * 0.13, 1 + side * 0.32)
    if (canine) {
      tooth.position.y -= 0.12
      tooth.rotation.z = Math.PI
      tooth.scale.z = 0.7
    }
    jaw.add(tooth)
  }

  return jaw
}

export default function ChatteringTeeth() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.8
    room.dispose()
    pmrem.dispose()

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40)
    camera.position.set(0, 0, 9)

    const toothMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfff4d9, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.16 })
    const shellMaterial = new THREE.MeshPhysicalMaterial({ color: 0xa50725, roughness: 0.3, metalness: 0.18, clearcoat: 1, clearcoatRoughness: 0.18 })
    const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.16, clearcoat: 1 })
    const pupilMaterial = new THREE.MeshPhysicalMaterial({ color: 0x030509, roughness: 0.12, clearcoat: 1 })
    const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x260613, roughness: 0.75 })
    const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xaab4c0, roughness: 0.24, metalness: 1 })

    const root = new THREE.Group()
    const rig = new THREE.Group()
    const upperJaw = createJaw(true, toothMaterial, shellMaterial)
    const lowerJaw = createJaw(false, toothMaterial, shellMaterial)

    const eyeGeometry = new THREE.SphereGeometry(0.64, 40, 28)
    const pupilGeometry = new THREE.SphereGeometry(0.27, 32, 20)
    const pupils: THREE.Mesh[] = []
    for (const x of [-0.7, 0.7]) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial)
      eye.position.set(x, 1.7, 0.54)
      upperJaw.add(eye)

      const pupil = new THREE.Mesh(pupilGeometry, pupilMaterial)
      pupil.position.set(x, 1.7, 1.11)
      pupil.scale.z = 0.58
      pupil.userData.homeX = x
      pupils.push(pupil)
      upperJaw.add(pupil)
    }

    const inner = new THREE.Mesh(
      new RoundedBoxGeometry(3.72, 0.7, 0.48, 6, 0.2),
      innerMaterial,
    )
    inner.position.set(0, -0.02, 0.34)

    const supportGeometry = new RoundedBoxGeometry(0.24, 1.35, 0.22, 4, 0.08)
    for (const x of [-0.72, 0.72]) {
      const support = new THREE.Mesh(supportGeometry, shellMaterial)
      support.position.set(x, -0.08, 0.66)
      rig.add(support)
    }

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.25, 20), metalMaterial)
    axle.rotation.z = Math.PI / 2
    axle.position.set(0, -0.08, 0.52)

    const crank = new THREE.Group()
    const crankShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.78, 18), metalMaterial)
    crankShaft.rotation.z = Math.PI / 2
    crankShaft.position.x = -2.56
    crank.add(crankShaft)
    for (const side of [-1, 1]) {
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.08, 12, 32), metalMaterial)
      bow.position.set(-2.97, side * 0.22, 0)
      bow.scale.x = 0.7
      crank.add(bow)
    }

    const hingeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.24, 28)
    for (const x of [-2.22, 2.22]) {
      const hinge = new THREE.Mesh(hingeGeometry, shellMaterial)
      hinge.rotation.x = Math.PI / 2
      hinge.position.set(x, -0.08, 0.47)
      rig.add(hinge)
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24), metalMaterial)
      screw.rotation.x = Math.PI / 2
      screw.position.set(x, -0.08, 0.61)
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.01), innerMaterial)
      slot.position.set(x, -0.08, 0.635)
      slot.rotation.z = x > 0 ? 0.5 : -0.4
      rig.add(screw, slot)
    }

    rig.add(inner, axle, crank, upperJaw, lowerJaw)
    // Feet belong to the root: the body can crouch without sliding the soles.
    const feet: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const foot = new THREE.Group()
      foot.position.set(side * 0.95, -2.15, 0.3)
      const coils = Array.from({ length: 97 }, (_, i) => {
        const t = i / 96
        return new THREE.Vector3(Math.cos(t * Math.PI * 8) * 0.14, t * 0.8, Math.sin(t * Math.PI * 8) * 0.14)
      })
      const leg = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coils), 96, 0.045, 8, false), metalMaterial)
      const shoe = new THREE.Mesh(new RoundedBoxGeometry(1.03, 0.4, 1.55, 6, 0.18), shellMaterial)
      shoe.position.z = 0.3
      const sole = new THREE.Mesh(new RoundedBoxGeometry(1.08, 0.12, 1.6, 4, 0.05), innerMaterial)
      sole.position.set(0, -0.18, 0.3)
      foot.add(leg, shoe, sole)
      foot.rotation.y = side * 0.2
      feet.push(foot)
      root.add(foot)
    }
    root.add(rig)
    scene.add(root)

    root.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    scene.add(new THREE.AmbientLight(0x879bb5, 0.3))
    const keyLight = new THREE.DirectionalLight(0xfff2dc, 3.5)
    keyLight.position.set(-3.5, 4.5, 6)
    scene.add(keyLight)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    Object.assign(keyLight.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.1, far: 30 })
    keyLight.shadow.normalBias = 0.025
    keyLight.shadow.bias = -0.0001
    const fillLight = new THREE.DirectionalLight(0x62bde8, 1.25)
    fillLight.position.set(4, -2, 3)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0xff5273, 3)
    rimLight.position.set(1, 3, -4)
    scene.add(rimLight)

    const timer = new THREE.Timer()
    timer.connect(document)
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const poster = new URLSearchParams(window.location.search).has("og")
    let stageWidth = 0
    let stageHeight = 0

    function resize() {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)

      stageHeight = 2 * Math.tan(THREE.MathUtils.degToRad(18)) * 9
      stageWidth = stageHeight * camera.aspect
      const rootScale = poster ? 0.82 : Math.min(0.31, stageWidth / 18)
      root.scale.setScalar(rootScale)
      root.position.set(0, width < 640 ? 1.98 : 1.58, 0)
    }

    function animate() {
      timer.update()
      const elapsed = timer.getElapsed()
      root.visible = poster || elapsed >= 3
      const motionTime = poster || reducedMotion.matches ? 0 : Math.max(0, elapsed - 4)
      const idleCycle = motionTime % 3.8
      const idleChatter = !poster && !reducedMotion.matches && idleCycle < 0.82
        ? Math.pow((Math.sin(motionTime * 48) + 1) / 2, 1.7) * 0.3
        : 0

      const jawOpen = 0.18 + idleChatter

      upperJaw.position.y = jawOpen * 0.06
      lowerJaw.position.y = -jawOpen * 0.94
      lowerJaw.rotation.x = -jawOpen * 0.16
      crank.rotation.x = motionTime * 0.7
      for (const pupil of pupils) {
        pupil.position.x = pupil.userData.homeX + Math.sin(motionTime * 0.7) * 0.045
        pupil.position.y = 1.7 + Math.cos(motionTime * 0.55) * 0.025
      }
      rig.position.y = 0

      // A pause, a short preload, a ballistic flight, then a damped landing.
      // Travel along the top/bottom margins; cross vertically only in wide gutters.
      const cycle = motionTime / 2.8
      const beat = cycle % 1
      const wide = window.innerWidth >= 1000
      const x = Math.max(0, stageWidth / 2 - root.scale.x * 3.5)
      const y = stageHeight / 2 - root.scale.x * 3.3 - 0.35
      const stops = wide
        ? [[0, y], [x, y], [x, -y], [0, -y], [-x, -y], [-x, y]]
        : [[0, y], [x * 0.45, y], [-x * 0.45, y]]
      const index = Math.floor(cycle) % stops.length
      const from = stops[index]
      const to = stops[(index + 1) % stops.length]
      const flight = THREE.MathUtils.clamp((beat - 0.38) / 0.32, 0, 1)
      const crouch = beat > 0.26 && beat < 0.38 ? Math.sin((beat - 0.26) / 0.12 * Math.PI) : 0
      const landing = beat > 0.7 ? Math.sin((beat - 0.7) * 50) * Math.exp(-(beat - 0.7) * 22) : 0
      root.position.set(
        THREE.MathUtils.lerp(from[0], to[0], flight),
        THREE.MathUtils.lerp(from[1], to[1], flight) + Math.sin(flight * Math.PI) * 0.35,
        0,
      )
      rig.position.y -= crouch * 0.24 + landing * 0.14
      upperJaw.position.y += landing * 0.1
      lowerJaw.rotation.x += landing * 0.08
      for (const [i, foot] of feet.entries()) {
        foot.rotation.x = Math.sin(flight * Math.PI) * (i === 0 ? 0.45 : -0.3)
      }
      if (!poster && !reducedMotion.matches && elapsed < 4) {
        const entrance = THREE.MathUtils.clamp(elapsed - 3, 0, 1)
        root.position.set(
          THREE.MathUtils.lerp(-stageWidth / 2 - root.scale.x * 4, 0, entrance),
          y + Math.sin(entrance * Math.PI) * 0.45,
          0,
        )
        for (const foot of feet) foot.rotation.x = Math.sin(entrance * Math.PI) * 0.4
      }
      if (poster) {
        root.position.set(2.65, 0, 0)
        root.rotation.set(-0.08, -0.35, -0.08)
        lowerJaw.position.y = -0.32
      }
      if (reducedMotion.matches && !poster) {
        root.position.x = 0
        root.rotation.set(0, 0, 0)
      }

      if (!reducedMotion.matches && !poster) {
        root.rotation.y = Math.sin(elapsed * 0.62) * 0.5
        root.rotation.x = -0.04 + Math.cos(elapsed * 0.38) * 0.055
        root.rotation.z = Math.sin(elapsed * 0.31) * 0.035
          - Math.sign(to[0] - from[0]) * Math.sin(flight * Math.PI) * 0.12
          + landing * 0.04
      }

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      toothMaterial.dispose()
      shellMaterial.dispose()
      eyeMaterial.dispose()
      pupilMaterial.dispose()
      innerMaterial.dispose()
      metalMaterial.dispose()
      environment.dispose()
      keyLight.shadow.map?.dispose()
      renderer.dispose()
      timer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="teeth-canvas" aria-hidden="true" />
}
