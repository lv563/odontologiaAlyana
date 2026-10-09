import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'

/** Perfil (radio, altura) de la corona + cuello, de abajo hacia arriba. Se revoluciona con
 * LatheGeometry; las dos raíces bifurcadas se agregan aparte como conos para que se lea
 * claramente como un diente (no como una gota). Sin depender de ningún modelo externo. */
const TOOTH_PROFILE: Array<[number, number]> = [
  [0.1, -0.62],
  [0.16, -0.5],
  [0.18, -0.4],
  [0.14, -0.3],
  [0.2, -0.18],
  [0.3, -0.02],
  [0.38, 0.1],
  [0.39, 0.24],
  [0.33, 0.36],
  [0.21, 0.44],
  [0.09, 0.48],
  [0.0, 0.5],
]

function ToothMesh() {
  const group = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  const geometry = useMemo(() => {
    const points = TOOTH_PROFILE.map(([r, y]) => new THREE.Vector2(r, y))
    const geo = new THREE.LatheGeometry(points, 64)
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.35
    const targetX = pointer.y * 0.25
    const targetZ = -pointer.x * 0.25
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.04
  })

  return (
    <Float speed={1.4} rotationIntensity={0} floatIntensity={0.7}>
      <group ref={group}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color="#fdfdfe" roughness={0.3} metalness={0.06} />
        </mesh>
        {/* Raíces bifurcadas: dos conos separados, apuntando hacia abajo e inclinados hacia afuera. */}
        <mesh position={[-0.09, -0.93, 0.01]} rotation={[Math.PI, 0, 0.22]} castShadow receiveShadow>
          <coneGeometry args={[0.085, 0.62, 20]} />
          <meshStandardMaterial color="#fdfdfe" roughness={0.3} metalness={0.06} />
        </mesh>
        <mesh position={[0.09, -0.93, -0.01]} rotation={[Math.PI, 0, -0.22]} castShadow receiveShadow>
          <coneGeometry args={[0.085, 0.62, 20]} />
          <meshStandardMaterial color="#fdfdfe" roughness={0.3} metalness={0.06} />
        </mesh>
      </group>
    </Float>
  )
}

export function Tooth3D() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 4.2], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#ffffff', '#cfe8e4', 1.1]} />
      <directionalLight
        position={[3, 4, 3]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2.5, 1, 2.5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, -1, 2]} intensity={14} color="#0d9488" distance={9} decay={2} />
      <pointLight position={[2.5, -1.5, -2]} intensity={12} color="#fb923c" distance={9} decay={2} />

      <ToothMesh />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.35} scale={6} blur={2.6} far={2} color="#0f172a" />
    </Canvas>
  )
}
