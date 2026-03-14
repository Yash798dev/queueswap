import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

function Ticket() {
  const groupRef = useRef();
  const edgeRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (edgeRef.current) {
      edgeRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
      <group ref={groupRef}>
        {/* Main ticket body */}
        <RoundedBox args={[3, 1.8, 0.08]} radius={0.12} smoothness={4}>
          <meshStandardMaterial
            color="#0F172A"
            metalness={0.8}
            roughness={0.15}
            transparent
            opacity={0.85}
          />
        </RoundedBox>

        {/* Glowing border */}
        <mesh ref={edgeRef}>
          <RoundedBox args={[3.06, 1.86, 0.1]} radius={0.13} smoothness={4}>
            <meshStandardMaterial
              color="#3B82F6"
              emissive="#3B82F6"
              emissiveIntensity={0.5}
              transparent
              opacity={0.2}
              side={THREE.BackSide}
            />
          </RoundedBox>
        </mesh>

        {/* Ticket stripe */}
        <mesh position={[-0.4, 0, 0.045]}>
          <planeGeometry args={[0.06, 1.4]} />
          <meshStandardMaterial
            color="#8B5CF6"
            emissive="#8B5CF6"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Barcode lines */}
        {[...Array(8)].map((_, i) => (
          <mesh key={i} position={[0.5 + i * 0.12, -0.5, 0.045]}>
            <planeGeometry args={[0.06, 0.3]} />
            <meshStandardMaterial
              color="#22D3EE"
              emissive="#22D3EE"
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}

        {/* QR-like block */}
        <mesh position={[-0.9, 0.3, 0.045]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#3B82F6"
            emissiveIntensity={0.4}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Holographic shimmer plane */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.9, 1.7]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#22D3EE"
            emissiveIntensity={0.05}
            transparent
            opacity={0.05}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function HolographicTicket3D({ className = '' }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[4, 4, 4]} intensity={1.5} color="#3B82F6" />
        <pointLight position={[-4, -2, 3]} intensity={1} color="#8B5CF6" />
        <pointLight position={[0, 3, -3]} intensity={0.8} color="#22D3EE" />
        <spotLight
          position={[0, 5, 3]}
          angle={0.6}
          penumbra={1}
          intensity={2}
          color="#3B82F6"
        />
        <Ticket />
      </Canvas>
    </div>
  );
}
