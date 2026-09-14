import { useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Howl } from 'howler';
function CityExporter() {
  const { scene } = useThree();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'e' || event.key === 'E') {
        exportToGLTF();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scene]);

  const exportToGLTF = () => {
    console.log("3D City Exporting...");
    const exporter = new GLTFExporter();
    const options = { binary: true, embedImages: true };

    exporter.parse(
      scene,
      (gltf) => {
        const blob = new Blob([gltf], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'my_3d_city.glb';
        link.click();
        URL.revokeObjectURL(link.href);
        alert('আপনার ৩ডি শহরটি সফলভাবে "my_3d_city.glb" নামে ডাউনলোড হয়েছে!');
      },
      (error) => console.error('Export Error:', error),
      options
    );
  };

  return null;
}

function createAmbientSound(type) {
  const sampleRate = 22050;
  const duration = type === "rain" ? 2 : 1.5;
  const sampleCount = sampleRate * duration;
  const data = new DataView(new ArrayBuffer(44 + sampleCount * 2));
  const writeString = (offset, value) => [...value].forEach((char, index) => data.setUint8(offset + index, char.charCodeAt(0)));
  writeString(0, "RIFF");
  data.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVEfmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true);
  data.setUint16(22, 1, true);
  data.setUint32(24, sampleRate, true);
  data.setUint32(28, sampleRate * 2, true);
  data.setUint16(32, 2, true);
  data.setUint16(34, 16, true);
  writeString(36, "data");
  data.setUint32(40, sampleCount * 2, true);

  for (let i = 0; i < sampleCount; i++) {
    const time = i / sampleRate;
    let sample = 0;
    if (type === "rain") {
      sample = (Math.random() * 2 - 1) * (0.18 + Math.random() * 0.22);
    } else if (type === "birds") {
      const chirp = Math.sin(time * 2100) * Math.max(0, Math.sin(time * 7));
      sample = chirp * 0.18 + Math.sin(time * 4600) * Math.max(0, Math.sin(time * 13)) * 0.08;
    } else {
      sample = Math.sin(time * 95) * 0.22 + Math.sin(time * 190) * 0.08;
    }
    const envelope = type === "rain" ? 1 : Math.min(1, Math.max(0, Math.sin(time * Math.PI / duration)));
    data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample * envelope)) * 0x7fff, true);
  }

  let binary = "";
  const bytes = new Uint8Array(data.buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const ambientAudioSources = {
  birds: createAmbientSound("birds"),
  rain: createAmbientSound("rain"),
  cars: createAmbientSound("cars")
};

// 🌠 ☄️ রাতের আকাশে উল্কাপিণ্ড / ধূমকেতু (Shooting Stars / Meteors)
function ShootingStars({ isNight }) {
  const groupRef = useRef();

  const meteors = useMemo(() => {
    return Array.from({ length: 5 }, () => ({
      x: (Math.random() - 0.5) * 350,
      y: 90 + Math.random() * 40,
      z: (Math.random() - 0.5) * 350,
      speed: 80 + Math.random() * 40,
      len: 12 + Math.random() * 10,
    }));
  }, []);

  useFrame((_, delta) => {
    if (isNight && groupRef.current) {
      groupRef.current.children.forEach((m, idx) => {
        const data = meteors[idx];
        m.position.x += delta * data.speed;
        m.position.y -= delta * (data.speed * 0.5);
        m.position.z += delta * (data.speed * 0.3);

        if (m.position.y < 20 || m.position.x > 250) {
          m.position.x = -200 - Math.random() * 50;
          m.position.y = 90 + Math.random() * 40;
          m.position.z = (Math.random() - 0.5) * 350;
        }
      });
    }
  });

  if (!isNight) return null;

  return (
    <group ref={groupRef}>
      {meteors.map((m, i) => (
        <group key={i} position={[m.x, m.y, m.z]} rotation={[0.4, 0.8, -0.6]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.4, m.len, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, -m.len / 2, 0]}>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshBasicMaterial color="#4cc9f0" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// 💨 ফ্যাক্টরির ধোঁয়া (Factory White Smoke Particles)
function FactorySmoke({ position }) {
  const smokeRef = useRef();

  const particles = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      x: (Math.random() - 0.5) * 0.8,
      y: Math.random() * 14,
      z: (Math.random() - 0.5) * 0.8,
      speed: 2 + Math.random() * 2,
      scale: 0.6 + Math.random() * 0.8,
      opacity: 0.7
    }));
  }, []);

  useFrame((_, delta) => {
    if (smokeRef.current) {
      smokeRef.current.children.forEach((p, i) => {
        const data = particles[i];
        p.position.y += delta * data.speed;
        p.position.x += Math.sin(p.position.y * 0.4) * delta * 0.8;
        p.scale.addScalar(delta * 0.4);

        if (p.position.y > 18) {
          p.position.y = 0;
          p.position.x = (Math.random() - 0.5) * 0.8;
          p.position.z = (Math.random() - 0.5) * 0.8;
          p.scale.set(data.scale, data.scale, data.scale);
        }
      });
    }
  });

  return (
    <group ref={smokeRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// 🏙️ ১. Shanghai Tower (অত্যাধুনিক স্পাইরালিং গ্লাস টাওয়ার)
function ShanghaiTower({ position = [0, 0, 0], isNight }) {
  const towerRef = useRef();

  useFrame((_, delta) => {
    if (towerRef.current) {
      towerRef.current.rotation.y += delta * 0.05;
    }
  });

  const tiers = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      y: i * 8 + 4,
      radiusTop: 6 - i * 0.45,
      radiusBottom: 6.8 - i * 0.45,
      rotation: (i * Math.PI) / 12,
    }));
  }, []);

  return (
    <group position={position}>
      <group ref={towerRef}>
        {tiers.map((t, i) => (
          <group key={i} position={[0, t.y, 0]} rotation={[0, t.rotation, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[t.radiusTop, t.radiusBottom, 8, 7]} />
              <meshStandardMaterial
                color={isNight ? "#0077b6" : "#48cae4"}
                metalness={0.9}
                roughness={0.1}
                transparent
                opacity={0.85}
                emissive={isNight ? "#00b4d8" : "#000000"}
                emissiveIntensity={isNight ? 0.6 : 0}
              />
            </mesh>
            <mesh position={[0, 4, 0]}>
              <torusGeometry args={[t.radiusTop + 0.1, 0.15, 16, 32]} />
              <meshStandardMaterial color="#00f5d4" emissive="#00f5d4" emissiveIntensity={isNight ? 2 : 0.2} />
            </mesh>
          </group>
        ))}
      </group>

      <mesh position={[0, 78, 0]} castShadow>
        <coneGeometry args={[1.2, 14, 8]} />
        <meshStandardMaterial color="#00f5d4" metalness={0.9} emissive={isNight ? "#00f5d4" : "#000000"} emissiveIntensity={isNight ? 2.5 : 0} />
      </mesh>
    </group>
  );
}

// 🏙️ ২. Petronas Twin Towers (টুইন টাওয়ারস ও স্কাইব্রিজ)
function PetronasTwinTowers({ position = [0, 0, 0], isNight }) {
  const towerSpacing = 14;

  const renderSingleTower = (xOffset) => (
    <group position={[xOffset, 0, 0]}>
      {[
        { y: 15, radius: 4.5, h: 30 },
        { y: 36, radius: 3.6, h: 12 },
        { y: 46, radius: 2.8, h: 8 },
        { y: 53, radius: 2.0, h: 6 },
      ].map((tier, idx) => (
        <mesh key={idx} position={[0, tier.y, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[tier.radius * 0.85, tier.radius, tier.h, 16]} />
          <meshStandardMaterial color="#d8f3dc" metalness={0.9} roughness={0.15} emissive={isNight ? "#90e0ef" : "#000000"} emissiveIntensity={isNight ? 0.5 : 0} />
        </mesh>
      ))}
      <mesh position={[0, 62, 0]} castShadow>
        <coneGeometry args={[0.8, 12, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.95} emissive={isNight ? "#ffffff" : "#000000"} emissiveIntensity={isNight ? 2 : 0} />
      </mesh>
    </group>
  );

  return (
    <group position={position}>
      {renderSingleTower(-towerSpacing / 2)}
      {renderSingleTower(towerSpacing / 2)}
      <group position={[0, 32, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[towerSpacing, 2.2, 3]} />
          <meshStandardMaterial color="#bde0fe" metalness={0.8} roughness={0.2} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -2, 0]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.2, 0.2, 8]} />
          <meshStandardMaterial color="#48cae4" />
        </mesh>
        <mesh position={[0, -2, 0]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.2, 0.2, 8]} />
          <meshStandardMaterial color="#48cae4" />
        </mesh>
      </group>
    </group>
  );
}
// 🌳 ৩. আধুনিক বোটানিক্যাল পার্ক ও ওয়াকওয়ে
function ModernParkGarden({ isNight, aiEvent, position = [180, 0, -150] }) {
  const benches = useMemo(() => [
    { x: -12, z: -10, rot: 0 },
    { x: 12, z: -10, rot: Math.PI },
    { x: -12, z: 12, rot: 0 },
    { x: 12, z: 12, rot: Math.PI },
    { x: 0, z: -20, rot: Math.PI / 2 },
  ], []);

  const flowerBeds = useMemo(() => {
    const items = [];
    for (let i = 0; i < 60; i++) {
      items.push({
        x: (Math.random() - 0.5) * 50,
        z: (Math.random() - 0.5) * 50,
        color: i % 3 === 0 ? "#ff4d6d" : (i % 3 === 1 ? "#ffb703" : "#7209b7"),
      });
    }
    return items;
  }, []);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color={aiEvent === 'WINTER' || aiEvent === 'SNOWFALL' ? "#e9ecef" : "#2d6a4f"} roughness={0.7} />
      </mesh>

      {/* একই ৮০x৮০ স্টাইলের boundary fence; park-এর চারদিক সম্পূর্ণ আবৃত */}
      <mesh position={[0, 2.5, -35]} castShadow>
        <boxGeometry args={[70, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[-35, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 5, 70]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[35, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 5, 70]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[-21, 2.5, 35]} castShadow>
        <boxGeometry args={[28, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[21, 2.5, 35]} castShadow>
        <boxGeometry args={[28, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[10, 68]} />
        <meshStandardMaterial color="#d4a373" roughness={0.4} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[68, 10]} />
        <meshStandardMaterial color="#d4a373" roughness={0.4} />
      </mesh>

      <group position={[0, 0, 34]}>
        <mesh position={[-12, 5, 0]} ><boxGeometry args={[2, 10, 2]} /><meshStandardMaterial color="#1d3557" /></mesh>
        <mesh position={[12, 5, 0]} ><boxGeometry args={[2, 10, 2]} /><meshStandardMaterial color="#1d3557" /></mesh>
        <mesh position={[0, 10, 0]} ><boxGeometry args={[26, 2.5, 1]} /><meshStandardMaterial color="#457b9d" emissive={isNight ? "#457b9d" : "#000"} emissiveIntensity={isNight ? 0.8 : 0} /></mesh>
        {/* <Text position={[0, 10, 0.6]} fontSize={1.4} color="#ffffff" anchorX="center" anchorY="middle">
          MODERN PARK GARDEN
        </Text> */}
      </group>

      {flowerBeds.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color={f.color} emissive={isNight ? f.color : "#000"} emissiveIntensity={isNight ? 0.5 : 0} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3]} />
            <meshStandardMaterial color="#52b788" />
          </mesh>
        </group>
      ))}

      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[3.5, 0.15, 1.2]} />
            <meshStandardMaterial color="#7f5539" />
          </mesh>
          <mesh position={[0, 1.1, -0.5]} castShadow>
            <boxGeometry args={[3.5, 0.8, 0.15]} />
            <meshStandardMaterial color="#7f5539" />
          </mesh>
          <mesh position={[-1.5, 0.3, 0]}><boxGeometry args={[0.2, 0.6, 1.2]} /><meshStandardMaterial color="#2b2d42" /></mesh>
          <mesh position={[1.5, 0.3, 0]}><boxGeometry args={[0.2, 0.6, 1.2]} /><meshStandardMaterial color="#2b2d42" /></mesh>
        </group>
      ))}

      {[[-20, -20], [20, -20], [-20, 20], [20, 20], [0, 0]].map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 8, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.35, 16]} />
            <meshStandardMaterial color="#2b2d42" metalness={0.8} />
          </mesh>
          <mesh position={[0, 16.2, 0]}>
            <boxGeometry args={[2.5, 0.4, 2.5]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={isNight ? 3 : 0.2} />
          </mesh>
          {isNight && <pointLight position={[0, 15.5, 0]} intensity={5} distance={35} color="#48cae4" />}
        </group>
      ))}

      {[[-25, -10], [25, 10], [-10, 25], [10, -25], [-25, 25], [25, -25]].map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.4, 0.6, 6]} /><meshStandardMaterial color="#582f0e" /></mesh>
          <mesh position={[0, 7, 0]} castShadow><sphereGeometry args={[3.2, 16, 16]} /><meshStandardMaterial color="#2d6a4f" /></mesh>
          {[
            [-1.8, 5.2, 0.4],
            [1.6, 6.1, 0.2],
            [0, 7.8, 1.5],
            [-0.6, 8.2, -1.2]
          ].map((lightPosition, lightIndex) => {
            const lightColors = ["#ff4d6d", "#ffbe0b", "#00f5d4", "#9b5de5"];
            const lightColor = lightColors[(i + lightIndex) % lightColors.length];
            return (
              <mesh key={`tree-chili-light-${lightIndex}`} position={lightPosition}>
                <sphereGeometry args={[0.22, 10, 10]} />
                <meshStandardMaterial
                  color={lightColor}
                  emissive={lightColor}
                  emissiveIntensity={isNight ? 5 : 0.35}
                  roughness={0.25}
                />
              </mesh>
            );
          })}
        </group>
      ))}
