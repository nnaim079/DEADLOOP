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

       {/* পার্কের walkway জুড়ে ছোট মরিচ-বাতির মতো colourful garden lights */}
            {Array.from({ length: 24 }, (_, i) => {
              const side = i % 4;
              const step = Math.floor(i / 4) * 10 - 25;
              const position = side === 0 ? [step, 1.15, -5.8]
                : side === 1 ? [step, 1.15, 5.8]
                  : side === 2 ? [-5.8, 1.15, step]
                    : [5.8, 1.15, step];
              const colors = ["#ff4d6d", "#ffbe0b", "#00f5d4", "#9b5de5"];
              return (
                <mesh key={`garden-string-light-${i}`} position={position}>
                  <sphereGeometry args={[0.28, 8, 8]} />
                  <meshStandardMaterial
                    color={colors[i % colors.length]}
                    emissive={colors[i % colors.length]}
                    emissiveIntensity={isNight ? 4 : 0.25}
                  />
                </mesh>
              );
            })}
          </group>
        );
      }
      
      // 🎋 🌳 বাঁশ ঝাড়, বটগাছ ও বড় ফুল গাছ (Custom Vegetation Elements)
      function BambooGrove({ position }) {
        const stalks = useMemo(() => Array.from({ length: 14 }, () => ({
          x: (Math.random() - 0.5) * 6,
          z: (Math.random() - 0.5) * 6,
          h: 12 + Math.random() * 6
        })), []);
      
        return (
          <group position={position}>
            {stalks.map((s, i) => (
              <group key={i} position={[s.x, 0, s.z]}>
                <mesh position={[0, s.h / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.12, 0.18, s.h, 8]} />
                  <meshStandardMaterial color="#38b000" />
                </mesh>
                {[0.3, 0.6, 0.8].map((factor, k) => (
                  <mesh key={k} position={[0, s.h * factor, 0]}>
                    <torusGeometry args={[0.2, 0.05, 8, 12]} rotation={[Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial color="#70e000" />
                  </mesh>
                ))}
                <mesh position={[0, s.h + 1, 0]}>
                  <sphereGeometry args={[1.5, 8, 8]} />
                  <meshStandardMaterial color="#55a630" />
                </mesh>
              </group>
            ))}
          </group>
        );
      }
      
      function BanyanTree({ position }) {
        return (
          <group position={position}>
            {/* বিশাল কাণ্ড ও ঝুড়ি মূল */}
            <mesh position={[0, 5, 0]} castShadow>
              <cylinderGeometry args={[2.5, 4, 10, 12]} />
              <meshStandardMaterial color="#3d2314" roughness={0.9} />
            </mesh>
            {[-2, 0, 2].map((x, i) => (
              <mesh key={i} position={[x, 3, 1]} rotation={[0, 0, 0.2 * (i - 1)]}>
                <cylinderGeometry args={[0.3, 0.5, 6]} />
                <meshStandardMaterial color="#2c180b" />
              </mesh>
            ))}
            {/* বটগাছের বিশাল ছাতা আকারের ক্যানোপি */}
            <mesh position={[0, 12, 0]} castShadow>
              <sphereGeometry args={[9, 24, 16]} scale={[1.4, 0.6, 1.4]} />
              <meshStandardMaterial color="#1b4332" roughness={0.6} />
            </mesh>
          </group>
        );
      }
      
      function BigFlowerTree({ position, flowerColor = "#ff4d6d" }) {
        return (
          <group position={position}>
            <mesh position={[0, 4, 0]} castShadow>
              <cylinderGeometry args={[0.6, 1.0, 8]} />
              <meshStandardMaterial color="#582f0e" />
            </mesh>
            <mesh position={[0, 10, 0]} castShadow>
              <dodecahedronGeometry args={[5, 1]} />
              <meshStandardMaterial color={flowerColor} emissive={flowerColor} emissiveIntensity={0.2} />
            </mesh>
          </group>
        );
      }
      
      // 🌴🌿 amusement park ও jungle-এর পাশে decorative botanical expansion
      function ScenicTreeExpansion({ isNight }) {
        const lightColors = ["#ff4d6d", "#ffbe0b", "#00f5d4", "#9b5de5"];
        const spiralPositions = (x, z, height, radius) =>
          Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            return [x + Math.cos(angle) * radius, 1.5 + (i / 7) * height, z + Math.sin(angle) * radius];
          });
      
        const palmPositions = [[218, 122], [252, 140], [218, 178], [152, 188], [-96, 118], [-74, 158]];
        const bambooPositions = [[230, 108], [265, 165], [-95, 105], [-70, 185]];
        const tulipPositions = [[235, 195], [275, 115], [-90, 205], [-55, 125]];
        const maplePositions = [[125, 125], [270, 190], [-70, 105], [-105, 190]];
      
        return (
          <group>
            {palmPositions.map(([x, z], i) => (
              <group key={`palm-${i}`} position={[x, 0, z]}>
                <mesh position={[0, 7, 0]} rotation={[0, 0, i % 2 ? 0.08 : -0.08]}>
                  <cylinderGeometry args={[0.55, 0.9, 14, 10]} />
                  <meshStandardMaterial color="#8d5524" roughness={0.8} />
                </mesh>
                <mesh position={[0, 15, 0]} scale={[1.5, 0.42, 1.5]}>
                  <sphereGeometry args={[5, 12, 8]} />
                  <meshStandardMaterial color="#168aad" roughness={0.7} />
                </mesh>
                {spiralPositions(0, 0, 11, 1.15).map((position, lightIndex) => (
                  <mesh key={lightIndex} position={position}>
                    <sphereGeometry args={[0.3, 8, 8]} />
                    <meshStandardMaterial color={lightColors[(i + lightIndex) % 4]} emissive={lightColors[(i + lightIndex) % 4]} emissiveIntensity={isNight ? 4 : 0.25} />
                  </mesh>
                ))}
              </group>
            ))}
      
            {bambooPositions.map(([x, z], i) => (
              <group key={`bamboo-${i}`} position={[x, 0, z]}>
                {Array.from({ length: 9 }, (_, stalk) => (
                  <group key={stalk} position={[(stalk % 3 - 1) * 1.2, 0, (Math.floor(stalk / 3) - 1) * 1.2]}>
                    <mesh position={[0, 7, 0]}>
                      <cylinderGeometry args={[0.16, 0.25, 14 + (stalk % 3), 8]} />
                      <meshStandardMaterial color="#2d6a4f" roughness={0.75} />
                    </mesh>
                    <mesh position={[0, 14.5, 0]}>
                      <sphereGeometry args={[1.2, 8, 6]} />
                      <meshStandardMaterial color="#52b788" />
                    </mesh>
                  </group>
                ))}
              </group>
            ))}
      
            {tulipPositions.map(([x, z], i) => (
              <group key={`tulip-${i}`} position={[x, 0, z]}>
                {Array.from({ length: 7 }, (_, flower) => (
                  <group key={flower} position={[(flower % 3 - 1) * 1.5, 0, (Math.floor(flower / 3) - 1) * 1.5]}>
                    <mesh position={[0, 2.3, 0]}><cylinderGeometry args={[0.08, 0.08, 4.5, 6]} /><meshStandardMaterial color="#40916c" /></mesh>
                    <mesh position={[0, 4.8, 0]}><sphereGeometry args={[0.65, 10, 8]} /><meshStandardMaterial color={["#ff006e", "#ffbe0b", "#8338ec"][flower % 3]} emissive={isNight ? ["#ff006e", "#ffbe0b", "#8338ec"][flower % 3] : "#000000"} emissiveIntensity={isNight ? 1.2 : 0} /></mesh>
                  </group>
                ))}
              </group>
            ))}
      
            {maplePositions.map(([x, z], i) => (
              <group key={`maple-${i}`} position={[x, 0, z]}>
                <mesh position={[0, 5, 0]}><cylinderGeometry args={[0.6, 1, 10, 10]} /><meshStandardMaterial color="#5c3d2e" roughness={0.85} /></mesh>
                <mesh position={[0, 11, 0]} scale={[1.5, 0.8, 1.35]}><sphereGeometry args={[5, 14, 10]} /><meshStandardMaterial color={["#e63946", "#f77f00", "#d00000"][i % 3]} roughness={0.7} /></mesh>
                {spiralPositions(0, 0, 8, 1.7).slice(0, 6).map((position, lightIndex) => (
                  <mesh key={lightIndex} position={position}>
                    <sphereGeometry args={[0.27, 8, 8]} />
                    <meshStandardMaterial color={lightColors[(i + lightIndex + 1) % 4]} emissive={lightColors[(i + lightIndex + 1) % 4]} emissiveIntensity={isNight ? 4 : 0.25} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        );
      }
      
// 🎡 ৪. থিম পার্ক (Theme Park Area with Fixed Boundaries & Z-Fix)
function ThemeParkComplex({ position, isNight }) {
  const wheelRef = useRef();

  useFrame((_, delta) => {
    if (wheelRef.current) {
      wheelRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* 🟢 ১. গ্রাউন্ড বেজ (আকার বাড়িয়ে ৮০x৮০ করা হয়েছে + Z-Fighting ফিক্সের জন্য polygonOffset) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#52b788"
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* 🔴 ২. বাউন্ডারি দেয়াল / ফেঞ্চ (৮০x৮০ পার্ককে পুরোপুরি কভার করবে) */}
      {/* পিছনের দেয়াল */}
      <mesh position={[0, 2.5, -40]} castShadow>
        <boxGeometry args={[80, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      {/* বামের দেয়াল */}
      <mesh position={[-40, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 5, 80]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      {/* ডানের দেয়াল */}
      <mesh position={[40, 2.5, 0]} castShadow>
        <boxGeometry args={[0.8, 5, 80]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      {/* সামনের দেয়াল (বাম অংশ) */}
      <mesh position={[-24, 2.5, 40]} castShadow>
        <boxGeometry args={[32, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      {/* সামনের দেয়াল (ডান অংশ) */}
      <mesh position={[24, 2.5, 40]} castShadow>
        <boxGeometry args={[32, 5, 0.8]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>

      {/* 🚪 ৩. এন্ট্রেন্স গেট ও সাইনবোর্ড (Z: 40 ফেঞ্চ লাইনে বসানো হয়েছে) */}
      <group position={[0, 0, 40]}>
        <mesh position={[-7, 4, 0]} castShadow>
          <boxGeometry args={[1.8, 8, 1.8]} />
          <meshStandardMaterial color="#2b2d42" />
        </mesh>
        <mesh position={[7, 4, 0]} castShadow>
          <boxGeometry args={[1.8, 8, 1.8]} />
          <meshStandardMaterial color="#2b2d42" />
        </mesh>

        <mesh position={[0, 8.5, 0]}>
          <boxGeometry args={[16, 2.5, 1.2]} />
          <meshStandardMaterial
            color="#ff0054"
            emissive={isNight ? "#ff0054" : "#000"}
            emissiveIntensity={isNight ? 0.8 : 0}
          />
        </mesh>

        {/* <Text
          position={[0, 8.5, 0.7]}
          fontSize={1.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          GRAND FUN PARK
        </Text> */}

        <mesh position={[-7, 8.2, 0.9]}>
          <boxGeometry args={[1, 0.3, 0.3]} />
          <meshStandardMaterial color="#4cc9f0" emissive="#4cc9f0" emissiveIntensity={isNight ? 3 : 0.2} />
        </mesh>
        <mesh position={[7, 8.2, 0.9]}>
          <boxGeometry args={[1, 0.3, 0.3]} />
          <meshStandardMaterial color="#4cc9f0" emissive="#4cc9f0" emissiveIntensity={isNight ? 3 : 0.2} />
        </mesh>

        {isNight && (
          <>
            <spotLight position={[-7, 9, 2]} target-position={[0, 0, 40]} intensity={8} distance={25} color="#ff0054" angle={0.6} />
            <spotLight position={[7, 9, 2]} target-position={[0, 0, 40]} intensity={8} distance={25} color="#4cc9f0" angle={0.6} />
            <pointLight position={[0, 7, -1]} intensity={4} distance={15} color="#ffea00" />
          </>
        )}

        {[-4, 4].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 0.1, -2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.2]} />
            <meshStandardMaterial color="#ffea00" emissive={isNight ? "#ffea00" : "#000"} emissiveIntensity={isNight ? 2 : 0} />
          </mesh>
        ))}
      </group>

      {/* 🪧 ৪. রাইড সাইনবোর্ডসমূহ */}
      <group position={[-12, 0, 24]} rotation={[0, Math.PI / 6, 0]}>
        <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.1, 0.1, 3]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[0, 3, 0]}><boxGeometry args={[4, 1.2, 0.2]} /><meshStandardMaterial color="#ffb703" /></mesh>
        {/* <Text position={[0, 3, 0.15]} fontSize={0.4} color="#000000" anchorX="center" anchorY="middle">
          FERRIS WHEEL 🎡
        </Text> */}
      </group>

      <group position={[12, 0, 24]} rotation={[0, -Math.PI / 6, 0]}>
        <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.1, 0.1, 3]} /><meshStandardMaterial color="#333" /></mesh>
        <mesh position={[0, 3, 0]}><boxGeometry args={[4, 1.2, 0.2]} /><meshStandardMaterial color="#ff5500" /></mesh>
        {/* <Text position={[0, 3, 0.15]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle">
          ROLLER COASTER 🎢
        </Text> */}
      </group>

      {/* 🎡 ৫. ফেরিস হুইল (ভেতরের সেফ পজিশনে) */}
      <group position={[-20, 0, -10]}>
        <mesh position={[-3, 12, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.4, 0.6, 24]} /><meshStandardMaterial color="#ffb703" /></mesh>
        <mesh position={[3, 12, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.4, 0.6, 24]} /><meshStandardMaterial color="#ffb703" /></mesh>
        
        <group ref={wheelRef} position={[0, 20, 0]}>
          <mesh><torusGeometry args={[11, 0.4, 16, 32]} /><meshStandardMaterial color="#4cc9f0" emissive={isNight ? "#4cc9f0" : "#000"} emissiveIntensity={isNight ? 1.5 : 0} /></mesh>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            return (
              <group key={i} rotation={[0, 0, angle]}>
                <mesh position={[0, 0, 0]}><boxGeometry args={[0.15, 22, 0.15]} /><meshStandardMaterial color="#ffffff" /></mesh>
                <mesh position={[0, 11, 0]}><boxGeometry args={[1.8, 1.8, 1.8]} /><meshStandardMaterial color="#ff0054" emissive={isNight ? "#ffea00" : "#000"} emissiveIntensity={isNight ? 1.5 : 0} /></mesh>
              </group>
            );
          })}
        </group>
      </group>

{/* 🎢 ৬. রোলারকোস্টার (ভেতরের সেফ পজিশনে) */}
      <group position={[18, 0, -10]}>
        <mesh position={[0, 8, 0]} rotation={[0.2, 0, 0.5]}><torusGeometry args={[10, 0.4, 16, 32, Math.PI * 1.5]} /><meshStandardMaterial color="#ff5500" emissive={isNight ? "#ff5500" : "#000"} emissiveIntensity={isNight ? 1 : 0} /></mesh>
      </group>

      {/* 🌳 ৭. গাছপালা (সীমানার একদম ভেতরে) */}
      <BambooGrove position={[-28, 0, 15]} />
      <BambooGrove position={[-25, 0, -25]} />
      <BanyanTree position={[25, 0, 15]} />
      <BigFlowerTree position={[0, 0, -25]} flowerColor="#ff70a6" />
      <BigFlowerTree position={[25, 0, -25]} flowerColor="#7209b7" />
    </group>
  );
}

// 🏡 ৫. ক্যালিফোর্নিয়ার এস্টেট রেসিডেন্সিয়াল নেইবারহুড (A, B, C, D)
function EastModernRollerCoaster({ isNight }) {
  const trainRef = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-42, 8, 0), new THREE.Vector3(-24, 28, -18),
    new THREE.Vector3(0, 12, -30), new THREE.Vector3(25, 7, -15),
    new THREE.Vector3(42, 18, 4), new THREE.Vector3(20, 10, 28),
    new THREE.Vector3(-12, 6, 24), new THREE.Vector3(-42, 8, 0)
  ], true, "catmullrom", 0.18), []);
  const supportPositions = useMemo(() => curve.getPoints(10).filter((_, i) => i % 2 === 0), [curve]);

  useFrame((state) => {
    if (!trainRef.current) return;
    const progress = (state.clock.getElapsedTime() * 0.035) % 1;
    trainRef.current.position.copy(curve.getPointAt(progress));
    trainRef.current.lookAt(curve.getPointAt((progress + 0.01) % 1));
  });

  return (
    <group position={[330, 0, 95]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[110, 95]} />
        <meshStandardMaterial color="#31572c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <tubeGeometry args={[curve, 96, 0.55, 10, true]} />
        <meshStandardMaterial color="#ff0054" metalness={0.75} roughness={0.2} emissive="#ff0054" emissiveIntensity={isNight ? 1.6 : 0.12} />
      </mesh>
      {supportPositions.map((point, i) => (
        <mesh key={`east-coaster-support-${i}`} position={[point.x, point.y / 2, point.z]}>
          <cylinderGeometry args={[0.65, 0.85, point.y, 10]} />
          <meshStandardMaterial color="#adb5bd" metalness={0.85} roughness={0.22} />
        </mesh>
      ))}
      <mesh ref={trainRef} position={[-42, 8, 0]}>
        <boxGeometry args={[3.2, 1.5, 5.5]} />
        <meshStandardMaterial color="#06d6a0" metalness={0.65} roughness={0.2} />
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[2.5, 0.8, 3.6]} />
          <meshStandardMaterial color="#dff6ff" transparent opacity={0.8} />
        </mesh>
      </mesh>
      {/* <Text position={[0, 33, -25]} fontSize={3.2} color="#ffbe0b" anchorX="center">
        EAST SKY LOOP
      </Text> */}
      {isNight && <pointLight position={[0, 10, 0]} color="#ff0054" intensity={3} distance={45} />}
    </group>
  );
}

function ModernResidentialNeighborhood({ position, rotation = [0, 0, 0], isNight, aiEvent }) {
  const isSnow = aiEvent === 'WINTER' || aiEvent === 'SNOWFALL';

  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[42, 36]} />
        <meshStandardMaterial color={isSnow ? "#e9ecef" : "#52b788"} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 14]}>
        <planeGeometry args={[42, 6]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>

      {/* মডার্ন ভিলা ১ */}
      <group position={[-12, 0, -4]}>
        <mesh position={[0, 4, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 8, 12]} />
          <meshStandardMaterial color="#f8f9fa" />
        </mesh>
        <mesh position={[0, 8.5, 0]} castShadow>
          <boxGeometry args={[13, 1, 13]} />
          <meshStandardMaterial color={isSnow ? "#ffffff" : "#2b2d42"} />
        </mesh>
        <mesh position={[0, 5, 6.05]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial color="#00b4d8" transparent opacity={0.7} emissive={isNight ? "#00b4d8" : "#000"} emissiveIntensity={isNight ? 0.8 : 0} />
        </mesh>
      </group>

{/* মডার্ন ভিলা ২ */}
      <group position={[12, 0, -4]}>
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[12, 9, 12]} />
          <meshStandardMaterial color="#e9c46a" />
        </mesh>
        <mesh position={[0, 9.5, 0]} castShadow>
          <coneGeometry args={[9, 4, 4]} rotation={[0, Math.PI / 4, 0]} />
          <meshStandardMaterial color={isSnow ? "#ffffff" : "#e76f51"} />
        </mesh>
        <mesh position={[0, 4, 6.05]}>
          <planeGeometry args={[7, 4]} />
          <meshStandardMaterial color="#caf0f8" transparent opacity={0.8} />
        </mesh>
      </group>

      {[-18, 0, 18].map((x, i) => (
        <group key={i} position={[x, 0, 11]}>
          <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 6]} /><meshStandardMaterial color="#212529" /></mesh>
          <mesh position={[0, 6, 0]}><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color={isNight ? "#ffea00" : "#ffffff"} emissive={isNight ? "#ffea00" : "#000"} emissiveIntensity={isNight ? 2.5 : 0} /></mesh>
        </group>
      ))}
    </group>
  );
}

// 🌧️❄️🌸🍂☀️🌾 ৬. আবহাওয়া ও ঋতু সিস্টেম
function WeatherEffects({ aiEvent }) {
  const rainRef = useRef();
  const snowRef = useRef();
  const petalRef = useRef();
  const autumnLeafRef = useRef();
  const lateAutumnLeafRef = useRef();
  const [flash, setFlash] = useState(false);

  const rainCount = 2000;
  const rainPositions = useMemo(() => {
    const pos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 850;
      pos[i + 1] = Math.random() * 80;
      pos[i + 2] = (Math.random() - 0.5) * 850;
    }
    return pos;
  }, []);

  const snowCount = 2000;
  const snowPositions = useMemo(() => {
    const pos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 850;
      pos[i + 1] = Math.random() * 80;
      pos[i + 2] = (Math.random() - 0.5) * 850;
    }
    return pos;
  }, []);

  const petalCount = 1000;
  const petalPositions = useMemo(() => {
    const pos = new Float32Array(petalCount * 3);
    for (let i = 0; i < petalCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 350;
      pos[i + 1] = Math.random() * 50;
      pos[i + 2] = (Math.random() - 0.5) * 350;
    }
    return pos;
  }, []);

  const leafCount = 1000;
  const leafPositions = useMemo(() => {
    const pos = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 350;
      pos[i + 1] = Math.random() * 50;
      pos[i + 2] = (Math.random() - 0.5) * 350;
    }
    return pos;
  }, []);

  const lateLeafCount = 700;
  const lateLeafPositions = useMemo(() => {
    const pos = new Float32Array(lateLeafCount * 3);
    for (let i = 0; i < lateLeafCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 350;
      pos[i + 1] = Math.random() * 50;
      pos[i + 2] = (Math.random() - 0.5) * 350;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if ((aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM') && rainRef.current) {
      const positionAttr = rainRef.current.geometry.attributes.position;
      const array = positionAttr.array;
      for (let i = 1; i < rainCount * 3; i += 3) {
        array[i] -= delta * 100;
        if (array[i] < 0) array[i] = 100;
      }
      positionAttr.needsUpdate = true;
    }

    if ((aiEvent === 'WINTER' || aiEvent === 'SNOWFALL') && snowRef.current) {
      const positionAttr = snowRef.current.geometry.attributes.position;
      const array = positionAttr.array;
      for (let i = 1; i < snowCount * 3; i += 3) {
        array[i] -= delta * 12;
        array[i - 1] += Math.sin(array[i] * 0.05) * 0.08;
        if (array[i] < 0) array[i] = 100;
      }
      positionAttr.needsUpdate = true;
    }

    if (aiEvent === 'SPRING' && petalRef.current) {
      const positionAttr = petalRef.current.geometry.attributes.position;
      const array = positionAttr.array;
      for (let i = 1; i < petalCount * 3; i += 3) {
        array[i] -= delta * 5;
        array[i - 1] += Math.sin(array[i] * 0.1) * 0.12;
        if (array[i] < 0) array[i] = 50;
      }
      positionAttr.needsUpdate = true;
    }

    if (aiEvent === 'AUTUMN' && autumnLeafRef.current) {
      const positionAttr = autumnLeafRef.current.geometry.attributes.position;
      const array = positionAttr.array;
      for (let i = 1; i < leafCount * 3; i += 3) {
        array[i] -= delta * 7;
        array[i - 1] += Math.cos(array[i] * 0.1) * 0.18;
        if (array[i] < 0) array[i] = 50;
      }
      positionAttr.needsUpdate = true;
    }

    if (aiEvent === 'LATE_AUTUMN' && lateAutumnLeafRef.current) {
      const positionAttr = lateAutumnLeafRef.current.geometry.attributes.position;
      const array = positionAttr.array;
      for (let i = 1; i < lateLeafCount * 3; i += 3) {
        array[i] -= delta * 4;
        array[i - 1] += Math.sin(array[i] * 0.08) * 0.1;
        if (array[i] < 0) array[i] = 50;
      }
      positionAttr.needsUpdate = true;
    }
  });

  useEffect(() => {
    if (aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM') {
      const interval = setInterval(() => {
        if (Math.random() > 0.5) {
          setFlash(true);
          setTimeout(() => setFlash(false), 120);
        }
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setFlash(false);
    }
  }, [aiEvent]);

  return (
    <group>
      {flash && <directionalLight position={[0, 80, 0]} intensity={15} color="#caf0f8" />}

      {(aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM') && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={rainCount} array={rainPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#a2d2ff" size={0.4} transparent opacity={0.8} depthWrite={false} />
        </points>
      )}

      {(aiEvent === 'WINTER' || aiEvent === 'SNOWFALL') && (
        <points ref={snowRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={snowCount} array={snowPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#ffffff" size={0.65} transparent opacity={0.9} depthWrite={false} />
        </points>
      )}

      {aiEvent === 'SPRING' && (
        <points ref={petalRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={petalCount} array={petalPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#ffb7c5" size={0.55} transparent opacity={0.85} depthWrite={false} />
        </points>
      )}

      {aiEvent === 'AUTUMN' && (
        <points ref={autumnLeafRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={leafCount} array={leafPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#fb8500" size={0.6} transparent opacity={0.9} depthWrite={false} />
        </points>
      )}

      {aiEvent === 'LATE_AUTUMN' && (
        <points ref={lateAutumnLeafRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={lateLeafCount} array={lateLeafPositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color="#d4a373" size={0.5} transparent opacity={0.8} depthWrite={false} />
        </points>
      )}
    </group>
  );
}

// ☁️ ডাইনামিক ক্লাউড
function DynamicClouds({ isNight, aiEvent }) {
  const cloudGroupRef = useRef();

  const clouds = useMemo(() => [
    { x: -55, y: 38, z: -72, scale: 2.4, color: "#f8f9fa", opacity: 0.78, shape: "light" },
    { x: -20, y: 52, z: -92, scale: 3.0, color: "#ffffff", opacity: 0.88, shape: "soft" },
    { x: 18, y: 34, z: -65, scale: 2.7, color: "#adb5bd", opacity: 0.72, shape: "heavy" },
    { x: 55, y: 68, z: -112, scale: 3.2, color: "#e9ecef", opacity: 0.82, shape: "tower" },
    { x: -38, y: 44, z: -130, scale: 2.6, color: "#6c757d", opacity: 0.62, shape: "storm" },
    { x: 42, y: 40, z: -82, scale: 2.3, color: "#ffffff", opacity: 0.8, shape: "light" },
    { x: -78, y: 63, z: -150, scale: 2.8, color: "#ced4da", opacity: 0.76, shape: "soft" },
    { x: 8, y: 78, z: -168, scale: 2.5, color: "#495057", opacity: 0.58, shape: "storm" },
    { x: -12, y: 32, z: -105, scale: 2.1, color: "#ffffff", opacity: 0.72, shape: "light" },
    { x: 72, y: 55, z: -142, scale: 2.8, color: "#dee2e6", opacity: 0.8, shape: "soft" },
    { x: -68, y: 82, z: -178, scale: 2.6, color: "#868e96", opacity: 0.6, shape: "heavy" },
    { x: 25, y: 60, z: -190, scale: 3.4, color: "#f1f3f5", opacity: 0.84, shape: "tower" },
  ], []);

  useFrame((state, delta) => {
    if (cloudGroupRef.current) {
      cloudGroupRef.current.position.x += delta * 2.0;
      if (cloudGroupRef.current.position.x > 120) {
        cloudGroupRef.current.position.x = -120;
      }

      const time = state.clock.getElapsedTime();
      cloudGroupRef.current.children.forEach((cloud, idx) => {
        cloud.position.y += Math.sin(time * 0.8 + idx) * 0.015;
      });
    }
  });

  return (
    <group ref={cloudGroupRef}>
      {clouds.map((c, i) => {
        const opacity = aiEvent === 'HEAVY_FOG' || aiEvent === 'LATE_AUTUMN'
          ? 0.95
          : (isNight ? c.opacity * 0.45 : c.opacity);
        const color = aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM' ? "#333333" : c.color;
        const shapeScale = c.shape === "tower" ? [0.85, 1.35, 0.9] : (c.shape === "heavy" ? [1.3, 0.8, 1.1] : [1, 1, 1]);
        return (
        <group key={i} position={[c.x, c.y, c.z]} scale={[c.scale * shapeScale[0], c.scale * shapeScale[1], c.scale * shapeScale[2]]}>
          <mesh position={[0, 0, 0]}><sphereGeometry args={[4.5, 12, 12]} /><meshStandardMaterial color={color} transparent opacity={opacity} /></mesh>
          <mesh position={[3.2, 0.6, 1.2]}><sphereGeometry args={[3.5, 12, 12]} /><meshStandardMaterial color={color} transparent opacity={opacity * 0.92} /></mesh>
          <mesh position={[-3.2, 0.4, -0.8]}><sphereGeometry args={[3.2, 12, 12]} /><meshStandardMaterial color={color} transparent opacity={opacity * 0.88} /></mesh>
          {c.shape === "storm" && <mesh position={[0, -2.8, 0]}><sphereGeometry args={[2.8, 12, 8]} /><meshStandardMaterial color={color} transparent opacity={opacity * 0.7} /></mesh>}
        </group>
        );
      })}
    </group>
  );
}
