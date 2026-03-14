import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Token() {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={1.5}>
      <group>
        {/* Main token disc */}
        <mesh ref={meshRef}>
          <cylinderGeometry args={[1.8, 1.8, 0.2, 64]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#3B82F6"
            emissiveIntensity={0.6}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Inner ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.11, 0]}>
          <torusGeometry args={[1.2, 0.04, 16, 64]} />
          <meshStandardMaterial
            color="#22D3EE"
            emissive="#22D3EE"
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* Outer ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
          <torusGeometry args={[1.6, 0.03, 16, 64]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Center sphere */}
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.35, 32, 32]} />
          <MeshDistortMaterial
            color="#22D3EE"
            emissive="#22D3EE"
            emissiveIntensity={0.8}
            speed={3}
            distort={0.3}
            radius={1}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Q text placeholder — glowing plane */}
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 6]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#3B82F6"
            emissiveIntensity={0.5}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Glow halo */}
        <mesh ref={glowRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.15, 16, 64]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#8B5CF6"
            emissiveIntensity={0.4}
            transparent
            opacity={0.15}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function HeroToken3D({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color="#3B82F6" />
        <pointLight position={[-5, -3, 3]} intensity={1} color="#8B5CF6" />
        <pointLight position={[0, 3, -5]} intensity={0.8} color="#22D3EE" />
        <spotLight
          position={[0, 8, 0]}
          angle={0.5}
          penumbra={1}
          intensity={1.5}
          color="#3B82F6"
        />
        <Token />
      </Canvas>
    </div>
  );
}
