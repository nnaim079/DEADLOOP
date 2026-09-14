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

// ✈️ পশ্চিম থেকে পূর্বে উড়ে চলা আধুনিক passenger aircraft
function Airplane({ position, speed, color, scale = 1, isNight, model = "787", delay = 0 }) {
  const planeRef = useRef();

  useFrame((state) => {
    if (!planeRef.current) return;
    const flightDuration = 520 / speed;
    const cycleTime = 120;
    const elapsed = state.clock.getElapsedTime();
    const cycleElapsed = (elapsed - delay + cycleTime) % cycleTime;
    const flying = cycleElapsed < flightDuration;
    planeRef.current.visible = flying;
    if (flying) {
      planeRef.current.position.x = -260 + cycleElapsed * speed;
    }
  });

  return (
    <group ref={planeRef} position={position} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.2, 1.45, 12, 16]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[5.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[1.2, 3.5, 16]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[-6.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[1.1, 2.8, 16]} />
        <meshStandardMaterial color={color} metalness={0.75} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[4.5, 0.18, 18]} />
        <meshStandardMaterial color="#e9ecef" metalness={0.55} roughness={0.25} />
      </mesh>
      {model === "A380" && (
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[3.2, 0.28, 15]} />
          <meshStandardMaterial color="#f8f9fa" metalness={0.55} roughness={0.25} />
        </mesh>
      )}
      <mesh position={[-4.2, 1.4, 0]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[3.2, 0.16, 5.5]} />
        <meshStandardMaterial color="#e9ecef" metalness={0.55} roughness={0.25} />
      </mesh>
      {[-3.5, -1.8, 0, 1.8, 3.5].map((z, i) => (
        <mesh key={i} position={[0, 1.25, z]}>
          <boxGeometry args={[1.1, 0.08, 0.55]} />
          <meshBasicMaterial color={isNight ? "#4cc9f0" : "#48cae4"} />
        </mesh>
      ))}
      <mesh position={[-2.5, -0.4, 0]}>
        <boxGeometry args={[0.35, 0.8, 1.2]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>
      <mesh position={[2.5, -0.4, 0]}>
        <boxGeometry args={[0.35, 0.8, 1.2]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>
      {(model === "A380" ? [-3.8, -1.3, 1.3, 3.8] : [-2.8, 2.8]).map((z, i) => (
        <mesh key={`engine-${i}`} position={[0, -0.45, z]}>
          <cylinderGeometry args={[0.5, 0.42, 1.5, 12]} />
          <meshStandardMaterial color="#495057" metalness={0.8} roughness={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.16, 0.16, 0.5]} />
        <meshBasicMaterial color={isNight ? "#ffffff" : "#ced4da"} />
      </mesh>
      <mesh position={[0, 0.05, -8.9]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshBasicMaterial color={isNight ? "#ff334b" : "#ced4da"} />
      </mesh>
      {isNight && (
        <>
          <pointLight position={[0, 0.4, 0]} intensity={1.4} distance={12} color="#ffffff" />
          <pointLight position={[0, 0, -8.9]} intensity={1} distance={8} color="#ff334b" />
        </>
      )}
    </group>
  );
}

function AirTraffic({ isNight }) {
  return (
    <group>
      <Airplane position={[-260, 92, -10]} speed={24} color="#f8f9fa" scale={1.3} isNight={isNight} model="A380" delay={0} />
      <Airplane position={[-260, 112, 35]} speed={19} color="#d9edff" scale={1} isNight={isNight} model="787" delay={60} />
    </group>
  );
}

// 🦅 আকাশে পাখি
function BirdsInSky() {
  const birdsGroupRef = useRef();
  const birdRefs = useRef([]);

  const birdData = useMemo(() => {
    const categories = [
      { type: "sparrow", body: "#a98467", wing: "#6c584c", scale: 0.7 },
      { type: "parrot", body: "#06d6a0", wing: "#118ab2", scale: 0.9 },
      { type: "dove", body: "#f1f3f5", wing: "#adb5bd", scale: 0.85 },
      { type: "eagle", body: "#6b4226", wing: "#3d2b1f", scale: 1.35 },
      { type: "seagull", body: "#e9ecef", wing: "#495057", scale: 1.05 },
      { type: "flamingo", body: "#ff70a6", wing: "#f72585", scale: 0.95 }
    ];
    return Array.from({ length: 36 }, (_, i) => ({
      x: (Math.random() - 0.5) * 120,
      y: 28 + Math.random() * 34,
      z: (Math.random() - 0.5) * 120,
      speed: 0.8 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      ...categories[i % categories.length]
    }));
  }, []);

  useFrame((state, delta) => {
    if (birdsGroupRef.current) {
      birdsGroupRef.current.rotation.y += delta * 0.15;
    }
    birdRefs.current.forEach((ref, idx) => {
      if (ref) {
        const wingAngle = Math.sin(state.clock.getElapsedTime() * 10 + birdData[idx].offset) * 0.4;
        ref.children[0].rotation.z = wingAngle;
        ref.children[1].rotation.z = -wingAngle;
      }
    });
  });

  return (
    <group ref={birdsGroupRef} position={[0, 10, 0]}>
      {birdData.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]} scale={b.scale} ref={(el) => (birdRefs.current[i] = el)}>
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.8, 0.05, 0.3]} />
            <meshBasicMaterial color={b.wing} />
          </mesh>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.8, 0.05, 0.3]} />
            <meshBasicMaterial color={b.wing} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.25, 8, 6]} />
            <meshBasicMaterial color={b.body} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.12, 0.6, 4]} rotation={[Math.PI / 2, 0, 0]} />
            <meshBasicMaterial color={b.type === "parrot" ? "#ffbe0b" : "#1d3557"} />
          </mesh>
          {b.type === "eagle" && <mesh position={[0, 0.28, 0]}><coneGeometry args={[0.16, 0.45, 5]} /><meshBasicMaterial color="#ffbe0b" /></mesh>}
          {b.type === "flamingo" && <mesh position={[0, -0.35, 0]}><cylinderGeometry args={[0.025, 0.025, 0.8, 6]} /><meshBasicMaterial color="#ff70a6" /></mesh>}
        </group>
      ))}
    </group>
  );
}

// 🌊 লেক
function DynamicLake({ isNight }) {
  const lakeMeshRef = useRef();

  useFrame((state) => {
    if (lakeMeshRef.current) {
      const time = state.clock.getElapsedTime();
      const pos = lakeMeshRef.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const z = Math.sin(u * 0.4 + time * 1.8) * 0.3 + Math.cos(v * 0.3 + time * 1.2) * 0.25;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      lakeMeshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group position={[115, 0.02, -40]}>
      <mesh ref={lakeMeshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[26, 64]} />
        <MeshReflectorMaterial
          blur={[400, 100]}
          resolution={1024}
          mirror={0.7}
          mixBlur={0.8}
          mixStrength={2.0}
          roughness={0.15}
          depthScale={1.5}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color={isNight ? "#075985" : "#67e8f9"}
          metalness={0.8}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[29.5, 64]} />
        <meshStandardMaterial color={isNight ? "#122c1f" : "#d4a373"} roughness={0.9} />
      </mesh>
    </group>
  );
}

function LakeRain({ isRaining, isNight }) {
  const rainRef = useRef();
  const rainCount = 900;
  const rainPositions = useMemo(() => {
    const positions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 58;
      positions[i + 1] = 2 + Math.random() * 16;
      positions[i + 2] = (Math.random() - 0.5) * 290;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!rainRef.current || !isRaining) return;
    const positionAttr = rainRef.current.geometry.attributes.position;
    const array = positionAttr.array;
    for (let i = 0; i < array.length; i += 3) {
      array[i + 1] -= delta * 36;
      array[i] += Math.sin(state.clock.getElapsedTime() * 3 + i) * 0.02;
      if (array[i + 1] < 0) {
        array[i] = (Math.random() - 0.5) * 58;
        array[i + 1] = 18 + Math.random() * 10;
        array[i + 2] = (Math.random() - 0.5) * 290;
      }
    }
    positionAttr.needsUpdate = true;
  });

  if (!isRaining) return null;

  return (
    <points ref={rainRef} position={[0, 10, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={rainCount} array={rainPositions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={isNight ? "#dfeeff" : "#cfe8ff"}
        size={0.35}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

function MetroAreaLake({ isNight, aiEvent }) {
  const boatRefs = useRef([]);
  const lakePlaneRef = useRef();
  const lakeCenter = [-335, 0, 0];
  const isRaining = aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM';
  const treePositions = useMemo(() => [
    [-36, -105, "#ff70a6"], [-36, -35, "#ffb703"], [-36, 42, "#e63946"], [-36, 112, "#7209b7"],
    [36, -112, "#ffb703"], [36, -42, "#ff70a6"], [36, 35, "#e63946"], [36, 108, "#ffb703"],
  ], []);

  useFrame((state) => {
    boatRefs.current.forEach((boat, index) => {
      if (!boat) return;
      const t = state.clock.getElapsedTime() * (0.12 + index * 0.025) + index * 2.8;
      boat.position.z = Math.sin(t) * 112;
      boat.position.x = Math.cos(t) * 4 + (index % 2 ? 8 : -8);
      boat.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;
    });

    if (lakePlaneRef.current) {
      const pos = lakePlaneRef.current.geometry.attributes.position;
      const time = state.clock.getElapsedTime();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const wave = Math.sin(x * 0.38 + time * 1.8) * 0.26 + Math.cos(y * 0.42 + time * 1.25) * 0.2;
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
      lakePlaneRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group position={lakeCenter}>
      <LakeRain isRaining={isRaining} isNight={isNight} />
      <mesh ref={lakePlaneRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 310, 32, 64]} />
        <MeshReflectorMaterial
          blur={[180, 60]}
          resolution={512}
          mirror={0.55}
          mixBlur={0.7}
          mixStrength={1.4}
          roughness={isRaining ? 0.2 : 0.16}
          color={isNight ? (isRaining ? "#0a6a8d" : "#0891b2") : (isRaining ? "#74d4f5" : "#67e8f9")}
          metalness={0.75}
        />
      </mesh>
      <mesh position={[-40, 0.12, 0]}>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, -155), new THREE.Vector3(-3, 0, -90),
          new THREE.Vector3(2, 0, -25), new THREE.Vector3(-2, 0, 45),
          new THREE.Vector3(3, 0, 105), new THREE.Vector3(0, 0, 155)
        ]), 48, 5.5, 8, false]} />
        <meshStandardMaterial color="#d8b384" roughness={0.85} />
      </mesh>
      <mesh position={[40, 0.12, 0]}>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, -155), new THREE.Vector3(3, 0, -90),
          new THREE.Vector3(-2, 0, -25), new THREE.Vector3(2, 0, 45),
          new THREE.Vector3(-3, 0, 105), new THREE.Vector3(0, 0, 155)
        ]), 48, 5.5, 8, false]} />
        <meshStandardMaterial color="#d8b384" roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`lake-border-${side}`} position={[side * 31.5, 0.45, 0]}>
          <boxGeometry args={[0.35, 0.35, 310]} />
          <meshStandardMaterial color="#48cae4" emissive="#48cae4" emissiveIntensity={isNight ? 2 : 0.2} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) => [-135, -80, -25, 35, 90, 145].map((z) => (
        <group key={`lake-lamp-${side}-${z}`} position={[side * 27, 0, z]}>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 5.6, 8]} />
            <meshStandardMaterial color="#343a40" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 5.8, 0]}>
            <sphereGeometry args={[0.42, 12, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 4 : 0.2} />
          </mesh>
          {isNight && <pointLight position={[0, 5.8, 0]} color="#fef08a" intensity={1.8} distance={14} />}
        </group>
      )))}
      {[-1, 1].flatMap((side) => [-135, -80, -25, 35, 90, 145].map((z) => (
        <group key={`walkway-bonsai-${side}-${z}`} position={[side * 40, 0, z]}>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.25, 0.45, 2.2, 8]} />
            <meshStandardMaterial color="#704214" />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <sphereGeometry args={[1.35, 12, 8]} />
            <meshStandardMaterial color="#386641" />
          </mesh>
          <mesh position={[0.75, 2.1, 0.15]}>
            <sphereGeometry args={[0.55, 10, 8]} />
            <meshStandardMaterial color="#6a994e" />
          </mesh>
        </group>
      )))}
      {[-1, 1].flatMap((side) => [-110, -55, 0, 55, 110].map((z) => (
        <mesh key={`walkway-marking-${side}-${z}`} position={[side * 40, 0.55, z]}>
          <boxGeometry args={[0.35, 0.08, 5]} />
          <meshStandardMaterial color="#fff4c2" emissive="#fff4c2" emissiveIntensity={isNight ? 1.2 : 0.05} />
        </mesh>
      )))}
      {[-1, 1].flatMap((side) => [-1, 1].flatMap((railSide) => [-135, -80, -25, 35, 90, 145].map((z) => (
        <group key={`walkway-railing-${side}-${railSide}-${z}`} position={[side * (40 + railSide * 6.2), 0, z]}>
          <mesh position={[0, 1.35, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 2.7, 8]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.55, 0]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshStandardMaterial color="#48cae4" emissive="#48cae4" emissiveIntensity={isNight ? 2 : 0.15} />
          </mesh>
        </group>
      ))))}
      <group position={[50, 0, 0]}>
        <mesh position={[0, 3.6, 0]}>
          <boxGeometry args={[16, 0.35, 250]} />
          <meshStandardMaterial color="#806044" roughness={0.85} />
        </mesh>
        {[-90, 0, 90].map((z) => (
          <group key={`lake-shelter-${z}`} position={[0, 0, z]}>
            <mesh position={[0, 3, 0]}>
              <boxGeometry args={[11, 0.35, 7]} />
              <meshStandardMaterial color="#4b2e1f" />
            </mesh>
            {[-4.5, 4.5].map((x) => (
              <mesh key={x} position={[x, 1.6, 0]}>
                <cylinderGeometry args={[0.18, 0.25, 3.2, 8]} />
                <meshStandardMaterial color="#5c4033" />
              </mesh>
            ))}
            <mesh position={[0, 1, 0]}>
              <boxGeometry args={[8, 0.35, 3]} />
              <meshStandardMaterial color="#c08457" />
            </mesh>
            <mesh position={[0, 0.55, -1]}>
              <boxGeometry args={[8, 0.25, 0.35]} />
              <meshStandardMaterial color="#8b5e34" />
            </mesh>
            {isNight && <pointLight position={[0, 2.5, 0]} color="#ffd166" intensity={1.5} distance={12} />}
          </group>
        ))}
      </group>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[54, 0.8, 10]} />
        <meshStandardMaterial color="#725c45" metalness={0.35} roughness={0.5} />
      </mesh>
      {[-18, -9, 0, 9, 18].map((x) => (
        <mesh key={`bridge-railing-${x}`} position={[x, 4, 0]}>
          <boxGeometry args={[0.35, 3.2, 0.35]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {[-18, 18].map((x) => (
        <group key={`bridge-light-${x}`} position={[x, 4.6, 0]}>
          <mesh>
            <sphereGeometry args={[0.5, 12, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 4 : 0.25} />
          </mesh>
          {isNight && <pointLight color="#fef08a" intensity={1.5} distance={12} />}
        </group>
      ))}
      {treePositions.map(([x, z, flowerColor], i) => (
        <group key={`lake-tree-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 3.2, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.7, 6.4, 8]} />
            <meshStandardMaterial color="#6b4226" />
          </mesh>
          <mesh position={[0, 7, 0]} castShadow>
            <sphereGeometry args={[3.2, 12, 8]} />
            <meshStandardMaterial color="#2d6a4f" />
          </mesh>
          <mesh position={[0, 8, 0]}>
            <sphereGeometry args={[1.1, 10, 8]} />
            <meshStandardMaterial color={flowerColor} emissive={isNight ? flowerColor : "#000000"} emissiveIntensity={isNight ? 1.4 : 0} />
          </mesh>
          {i % 2 === 0 && <mesh position={[1.7, 5.8, 0.5]}><sphereGeometry args={[0.65, 10, 8]} /><meshStandardMaterial color="#e76f51" /></mesh>}
        </group>
      ))}
      {[[-10, -52], [10, 58]].map(([x, z], i) => (
        <group key={`lake-boat-${i}`} ref={(boat) => (boatRefs.current[i] = boat)} position={[x, 0.8, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <coneGeometry args={[2.5, 9, 6]} />
            <meshStandardMaterial color={i ? "#f8f9fa" : "#ffb703"} metalness={0.8} roughness={0.18} />
          </mesh>
          <mesh position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[2.4, 1.2, 4.8]} />
            <meshStandardMaterial color={i ? "#2563eb" : "#e63946"} metalness={0.65} roughness={0.22} />
          </mesh>
          <mesh position={[0, 2.5, 0]}>
            <boxGeometry args={[2.1, 0.12, 4.1]} />
            <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={isNight ? 2.5 : 0.2} />
          </mesh>
          <mesh position={[0, 3.05, 0.2]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[2.2, 1.1, 2.4]} />
            <meshStandardMaterial color="#dff6ff" metalness={0.2} roughness={0.05} transparent opacity={0.72} />
          </mesh>
          <mesh position={[0, 3.65, 0.2]}>
            <boxGeometry args={[2.5, 0.16, 2.8]} />
            <meshStandardMaterial color="#f1faee" metalness={0.5} roughness={0.18} />
          </mesh>
          <mesh position={[0, 2.9, -2.1]}>
            <sphereGeometry args={[0.24, 12, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 4 : 0.2} />
          </mesh>
          {isNight && <pointLight position={[0, 3, -2]} color="#fef08a" intensity={1.2} distance={8} />}
        </group>
      ))}
      {isNight && <pointLight position={[0, 5, 0]} color="#48cae4" intensity={3} distance={45} />}
    </group>
  );
}

// 🏔️ পাহাড় ও ঝর্ণা + হসপিটালের পেছনের নতুন পাহাড় ও মানুষ (Hikers climbing mountains)
function SnowMountains({ isNight }) {
  const waterfallRef = useRef();
  const foamRef = useRef();
  const hikerRef = useRef();

  useFrame((state) => {
    if (waterfallRef.current) {
      const t = state.clock.getElapsedTime() * 4;
      waterfallRef.current.material.map?.offset.setY(-t % 1);
    }
    if (foamRef.current) {
      const s = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.15;
      foamRef.current.scale.set(s, s, s);
    }
    if (hikerRef.current) {
      const time = state.clock.getElapsedTime();
      hikerRef.current.position.y = 12 + Math.sin(time * 1.5) * 4;
      hikerRef.current.position.x = 8 + Math.cos(time * 1.5) * 3;
    }
  });

  return (
    <group position={[-380, 0, -360]}>
      <mesh position={[0, 35, 0]} castShadow>
        <coneGeometry args={[45, 70, 6]} />
        <meshStandardMaterial color={isNight ? "#1c2541" : "#4a5759"} flatShading />
      </mesh>
      <mesh position={[0, 60, 0]}>
        <coneGeometry args={[16, 22, 6]} />
        <meshStandardMaterial color="#ffffff" flatShading />
      </mesh>

      <mesh position={[55, 25, -15]} castShadow>
        <coneGeometry args={[35, 50, 6]} />
        <meshStandardMaterial color={isNight ? "#0b132b" : "#3b4746"} flatShading />
      </mesh>

      {/* ঝর্ণা */}
      <group position={[12, 0, 20]}>
        <mesh ref={waterfallRef} position={[0, 24, 0]} rotation={[0.2, 0, 0]}>
          <planeGeometry args={[7, 48]} />
          <meshStandardMaterial color="#90e0ef" emissive="#00b4d8" emissiveIntensity={0.6} transparent opacity={0.85} roughness={0.1} />
        </mesh>
        <mesh position={[0, 47, -3]}>
          <boxGeometry args={[9, 2, 6]} />
          <meshStandardMaterial color="#48cae4" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 3]}>
          <circleGeometry args={[10, 16]} />
          <meshStandardMaterial color="#0077b6" roughness={0.1} />
        </mesh>
        <mesh ref={foamRef} position={[0, 0.8, 2.5]}>
          <sphereGeometry args={[4.5, 12, 12]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// 🏔️🏥 হসপিটালের পেছনের পাহাড় এবং পাহাড়ে ওঠা মানুষ (Mountain Hikers)
function HospitalBackingMountains({ isNight }) {
  const hikerRef = useRef();

  useFrame((state) => {
    if (hikerRef.current) {
      const time = state.clock.getElapsedTime();
      hikerRef.current.position.y = 15 + (Math.sin(time * 0.8) + 1) * 8;
      hikerRef.current.position.z = -10 + (Math.cos(time * 0.8)) * 4;
    }
  });

  return (
    <group position={[380, 0, -360]}>
      {/* দুইটা বিশাল ব্যাকড্রপ পাহাড় */}
      <mesh position={[0, 30, 0]} castShadow>
        <coneGeometry args={[35, 60, 6]} />
        <meshStandardMaterial color={isNight ? "#0f172a" : "#334155"} flatShading />
      </mesh>
      <mesh position={[-40, 22, 10]} castShadow>
        <coneGeometry args={[28, 44, 6]} />
        <meshStandardMaterial color={isNight ? "#1e293b" : "#475569"} flatShading />
      </mesh>

      {/* ট্রেইল ও পাহাড়ে ওঠা মানুষ */}
      <group ref={hikerRef} position={[0, 15, 12]}>
        <mesh position={[0, 1.6, 0]}><sphereGeometry args={[0.3, 8, 8]} /><meshStandardMaterial color="#ffb703" /></mesh>
        <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.5, 0.9, 0.4]} /><meshStandardMaterial color="#d62828" /></mesh>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.4, 0.7, 0.3]} /><meshStandardMaterial color="#003049" /></mesh>
      </group>
    </group>
  );
}

function NorthIceMountainRange({ isNight }) {
  const clusters = [
    [-380, 32, 46], [-330, 22, 32], [-275, 42, 58], [-215, 25, 38],
    [-155, 52, 70], [-85, 28, 42], [0, 46, 64], [78, 24, 36],
    [145, 58, 76], [220, 30, 48], [285, 44, 60], [350, 26, 40],
  ];

  return (
    <group position={[0, 0, -365]}>
      {clusters.map(([x, height, radius], i) => (
        <group key={`north-ice-cluster-${i}`} position={[x, 0, (i % 2) * 12]}>
          <mesh position={[0, height / 2, 0]} castShadow>
            <coneGeometry args={[radius, height, 7]} />
            <meshStandardMaterial color={isNight ? "#1b2a41" : "#536878"} flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, height * 0.82, 0]} castShadow>
            <coneGeometry args={[radius * 0.48, height * 0.38, 7]} />
            <meshStandardMaterial color={isNight ? "#dceeff" : "#f8fbff"} flatShading roughness={0.7} />
          </mesh>
          <mesh position={[radius * 0.18, height * 0.46, radius * 0.28]} rotation={[0, 0.25, 0]}>
            <coneGeometry args={[radius * 0.08, height * 0.58, 5]} />
            <meshStandardMaterial color={isNight ? "#b8d9ef" : "#eaf6ff"} flatShading />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3, 8]} receiveShadow>
        <boxGeometry args={[820, 6, 28]} />
        <meshStandardMaterial color={isNight ? "#162235" : "#8fa9b8"} roughness={0.95} />
      </mesh>
    </group>
  );
}

function MountainRainColumn({ x, z, delay, isNight, storm }) {
  const rainRef = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      values[i * 3] = (Math.random() - 0.5) * 9;
      values[i * 3 + 1] = Math.random() * 78;
      values[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    const rain = rainRef.current;
    if (!rain) return;
    const phase = (state.clock.getElapsedTime() + delay) % 18;
    rain.visible = storm || (phase > 3 && phase < 10);
    const values = rain.geometry.attributes.position.array;
    for (let i = 1; i < values.length; i += 3) {
      values[i] -= delta * 80;
      if (values[i] < 0) values[i] = 78;
    }
    rain.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={rainRef} position={[x, 0, z]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={90} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={isNight ? "#7dd3fc" : "#a2d2ff"} size={0.32} transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

function NorthMountainCloudWeather({ isNight, aiEvent }) {
  const storm = aiEvent === "MONSOON" || aiEvent === "RAIN_STORM";
  const clouds = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: -400 + i * 46 + (i % 2) * 9,
    y: 92 + (i % 4) * 9,
    z: -405 - (i % 3) * 16,
    scale: 4 + (i % 4) * 0.75
  })), []);

  return (
    <group>
      {clouds.map((cloud, i) => (
        <group key={`north-cloud-${i}`} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
          <mesh>
            <sphereGeometry args={[4.5, 12, 10]} />
            <meshStandardMaterial color={storm ? "#4b5563" : "#dbeafe"} transparent opacity={isNight ? 0.48 : 0.76} />
          </mesh>
          <mesh position={[3.2, 0.5, 0.6]}>
            <sphereGeometry args={[3.4, 12, 10]} />
            <meshStandardMaterial color={storm ? "#374151" : "#f8fafc"} transparent opacity={isNight ? 0.4 : 0.7} />
          </mesh>
        </group>
      ))}
      {clouds.filter((_, i) => i % 2 === 0).map((cloud, i) => (
        <MountainRainColumn
          key={`mountain-rain-${i}`}
          x={cloud.x}
          z={cloud.z + 18}
          delay={i * 2.4}
          isNight={isNight}
          storm={storm}
        />
      ))}
    </group>
  );
}

// 🌲 জঙ্গল
function DenseForestZone({ aiEvent }) {
  const forestRef = useRef();

  const trees = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i++) {
      list.push({
        x: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 60,
        scale: 1.0 + Math.random() * 0.8
      });
    }
    return list;
  }, []);

  useFrame((state) => {
    if (forestRef.current) {
      const time = state.clock.getElapsedTime();
      forestRef.current.children.forEach((treeGroup, idx) => {
        if (treeGroup.children[1] && treeGroup.children[2]) {
          const sway = Math.sin(time * 2 + idx) * 0.08;
          treeGroup.children[1].rotation.z = sway;
          treeGroup.children[2].rotation.z = sway * 1.2;
        }
      });
    }
  });

  const getFoliageColor = (layer) => {
    if (aiEvent === 'WINTER' || aiEvent === 'SNOWFALL') return layer === 1 ? "#ffffff" : "#f8f9fa";
    if (aiEvent === 'SUMMER') return layer === 1 ? "#1b4332" : "#2d6a4f";
    if (aiEvent === 'AUTUMN') return layer === 1 ? "#d90429" : "#ffb703";
    if (aiEvent === 'LATE_AUTUMN') return layer === 1 ? "#b5838d" : "#e07a5f";
    if (aiEvent === 'SPRING') return layer === 1 ? "#ff70a6" : "#ff97b7";
    return layer === 1 ? "#22577a" : "#38b000";
  };

  return (
    <group position={[-140, 0, 140]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color={aiEvent === 'WINTER' || aiEvent === 'SNOWFALL' ? "#e9ecef" : (aiEvent === 'AUTUMN' ? "#6b705c" : "#132a13")} />
      </mesh>
      <group ref={forestRef}>
        {trees.map((t, idx) => (
          <group key={idx} position={[t.x, 0, t.z]} scale={t.scale}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.7, 5]} />
              <meshStandardMaterial color="#2d1a0e" />
            </mesh>
            <mesh position={[0, 6.5, 0]} castShadow>
              <coneGeometry args={[3.2, 7.5, 6]} />
              <meshStandardMaterial color={getFoliageColor(1)} flatShading />
            </mesh>
            <mesh position={[0, 9, 0]} castShadow>
              <coneGeometry args={[2.5, 5.5, 6]} />
              <meshStandardMaterial color={getFoliageColor(2)} flatShading />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// 🌾🌱 ডাইনামিক ফিল্ড ডিটেইলস
function DetailedGroundField({ aiEvent }) {
  const grassGroupRef = useRef();

  const fieldItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < 400; i++) {
      items.push({
        x: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 400,
        scale: 0.5 + Math.random() * 0.6,
        type: Math.random() > 0.4 ? 'GRASS' : (Math.random() > 0.5 ? 'FLOWER_YELLOW' : 'FLOWER_PINK')
      });
    }
    return items;
  }, []);

  useFrame((state) => {
    if (grassGroupRef.current) {
      const time = state.clock.getElapsedTime();
      grassGroupRef.current.children.forEach((item, idx) => {
        item.rotation.z = Math.sin(time * 3 + idx) * 0.1;
      });
    }
  });

  const isSnow = aiEvent === 'WINTER' || aiEvent === 'SNOWFALL';
  const isAutumn = aiEvent === 'AUTUMN';
  const isLateAutumn = aiEvent === 'LATE_AUTUMN';
  const isSummer = aiEvent === 'SUMMER';

  const getGrassColor = () => {
    if (isSnow) return "#ffffff";
    if (isSummer) return "#a3b18a";
    if (isAutumn) return "#cb997e";
    if (isLateAutumn) return "#ddb892";
    return "#52b788";
  };

  return (
    <group ref={grassGroupRef}>
      {fieldItems.map((item, i) => (
        <group key={i} position={[item.x, 0, item.z]} scale={item.scale}>
          <mesh position={[0, 0.4, 0]} rotation={[0, (i % 4) * 0.5, 0]} castShadow>
            <coneGeometry args={[0.15, 1.0, 3]} />
            <meshStandardMaterial color={getGrassColor()} />
          </mesh>
          {item.type === 'FLOWER_YELLOW' && !isSnow && (
            <mesh position={[0, 1.05, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color="#ffb703" />
            </mesh>
          )}
          {item.type === 'FLOWER_PINK' && !isSnow && (
            <mesh position={[0, 1.05, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color="#ff4d6d" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// 🚗 গাড়ি
function isTrafficGreen(axis, elapsedTime) {
  const phase = elapsedTime % 12;
  return axis === "z" ? phase < 5.5 : phase >= 6.5;
}

function MovingCar({ startZ, speed, color = "#d62828", posX = 35, brand = "BMW", axis = "z", direction = 1, lane = "city", roadLane }) {
  const carRef = useRef();
  const laneOffset = lane === "boundary" ? 245 : 35;
  const roadCenter = axis === "z"
    ? (posX < 0 ? -laneOffset : laneOffset)
    : (roadLane ?? (lane === "boundary" ? (startZ < 0 ? -245 : 245) : (startZ < 0 ? -70 : 70)));
  const roadPosition = axis === "z"
    ? roadCenter + (direction > 0 ? -3.2 : 3.2)
    : roadCenter + (direction > 0 ? 3.2 : -3.2);
  const travelLimit = lane === "boundary" ? 248 : 240;

  useFrame((state, delta) => {
    if (carRef.current) {
      const coordinate = axis === "z" ? carRef.current.position.z : carRef.current.position.x;
      const intersections = lane === "boundary" ? [] : (axis === "z" ? [-70, 70] : [-35, 35]);
      const upcomingIntersection = intersections.find((point) =>
        direction > 0 ? point >= coordinate : point <= coordinate
      );
      const approachingSignal = upcomingIntersection !== undefined && Math.abs(upcomingIntersection - coordinate) < 13;
      const stoppedAtRed = approachingSignal && !isTrafficGreen(axis, state.clock.getElapsedTime());
      const movement = stoppedAtRed ? 0 : delta * speed * direction;
      if (axis === "z") {
        carRef.current.position.z += movement;
        if (direction > 0 && carRef.current.position.z > travelLimit) carRef.current.position.z = -travelLimit;
        if (direction < 0 && carRef.current.position.z < -travelLimit) carRef.current.position.z = travelLimit;
      } else {
        carRef.current.position.x += movement;
        if (direction > 0 && carRef.current.position.x > travelLimit) carRef.current.position.x = -travelLimit;
        if (direction < 0 && carRef.current.position.x < -travelLimit) carRef.current.position.x = travelLimit;
      }
    }
  });

  return (
    <group ref={carRef} position={[axis === "z" ? roadPosition : startZ, 0, axis === "z" ? startZ : roadPosition]} rotation={[0, axis === "z" ? (direction > 0 ? 0 : Math.PI) : (direction > 0 ? Math.PI / 2 : -Math.PI / 2), 0]}>
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[brand === "Rolls-Royce" ? 2.8 : 2.6, 1.25, brand === "Ferrari" ? 4.8 : 5.2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.22} />
      </mesh>
      <mesh position={[0, 1.55, -0.2]}>
        <boxGeometry args={[2.25, 1.0, 2.6]} />
        <meshStandardMaterial color={brand === "Jeep" ? "#9c6644" : "#bde0fe"} metalness={0.35} roughness={0.12} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0.9, 0.6, 2.51]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-0.9, 0.6, 2.51]}>
        <boxGeometry args={[0.4, 0.3, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={3} />
      </mesh>
      {[-1, 1].map((x) => [-1.65, 1.65].map((z) => (
        <mesh key={`${x}-${z}`} position={[x, 0.45, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.28, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.85} />
        </mesh>
      )))}
      <mesh position={[0, 1.18, -2.48]}>
        <boxGeometry args={[2.1, 0.12, 0.16]} />
        <meshStandardMaterial color="#111111" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.95, 2.62]}>
        <boxGeometry args={[1.35, 0.18, 0.08]} />
        <meshStandardMaterial color="#f8f9fa" emissive="#ffffff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function TrafficSignal({ position, axis }) {
  const redRef = useRef();
  const yellowRef = useRef();
  const greenRef = useRef();

  useFrame((state) => {
    const green = isTrafficGreen(axis, state.clock.getElapsedTime());
    if (redRef.current) redRef.current.material.emissiveIntensity = green ? 0.1 : 4;
    if (yellowRef.current) yellowRef.current.material.emissiveIntensity = green ? 0.1 : 0.6;
    if (greenRef.current) greenRef.current.material.emissiveIntensity = green ? 4 : 0.1;
  });

  return (
    <group position={position}>
      <mesh position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 6.4, 8]} />
        <meshStandardMaterial color="#343a40" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 6.25, 0]}>
        <boxGeometry args={[1.1, 2.8, 0.7]} />
        <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh ref={redRef} position={[0, 6.95, 0.38]}>
        <sphereGeometry args={[0.25, 12, 8]} />
        <meshStandardMaterial color="#ef233c" emissive="#ef233c" emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={yellowRef} position={[0, 6.25, 0.38]}>
        <sphereGeometry args={[0.25, 12, 8]} />
        <meshStandardMaterial color="#ffbe0b" emissive="#ffbe0b" emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={greenRef} position={[0, 5.55, 0.38]}>
        <sphereGeometry args={[0.25, 12, 8]} />
        <meshStandardMaterial color="#06d6a0" emissive="#06d6a0" emissiveIntensity={0.1} />
      </mesh>
      {axis === "x" && <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]}><boxGeometry args={[0.2, 0.2, 0.2]} /><meshBasicMaterial color="#06d6a0" /></mesh>}
    </group>
  );
}

// 🌙 চাঁদ
function CrescentMoon() {
  return (
    <group position={[-50, 85, -100]} rotation={[0.2, 0.4, -0.3]}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshStandardMaterial color="#fefae0" emissive="#fff3b0" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[4, 1.4, 2]}>
        <sphereGeometry args={[7.5, 32, 32]} />
        <meshBasicMaterial color="#0b1a30" />
      </mesh>
    </group>
  );
}

// 🌌 নক্ষত্রমণ্ডল
function StarConstellations() {
  const starsRef = useRef();

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.children.forEach((star, i) => {
        star.material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() * 3 + i) * 0.5;
      });
    }
  });

  const constellationStars = [
    [-60, 60, -80], [-50, 65, -80], [-40, 62, -80], [-30, 55, -80],
    [-28, 45, -80], [-38, 42, -80], [-50, 48, -80],
    [60, 70, -90], [70, 65, -90], [80, 75, -90], [75, 58, -90]
  ];

  return (
    <group ref={starsRef}>
      {constellationStars.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// 🌊 নদী
function DynamicRiver({ isNight }) {
  const riverRef = useRef();

  useFrame((state) => {
    if (riverRef.current) {
      const time = state.clock.getElapsedTime();
      const pos = riverRef.current.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = Math.sin(x * 0.2 + time * 2.5) * 0.2 + Math.cos(y * 0.2 + time * 2.0) * 0.18;
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      riverRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group position={[0, 0.005, 0]}>
      <mesh ref={riverRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[550, 28, 64, 32]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mirror={0.65}
          mixBlur={0.7}
          mixStrength={1.8}
          roughness={0.1}
          depthScale={1.2}
          color={isNight ? "#023e8a" : "#00b4d8"}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// 🌉 নদী ব্রিজ
function NorthRiverBridge() {
  return (
    <group position={[35, 1.5, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 1.0, 36]} />
        <meshStandardMaterial color="#343a40" />
      </mesh>
      <mesh position={[-7, -2.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 8]} />
        <meshStandardMaterial color="#495057" />
      </mesh>
      <mesh position={[7, -2.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.5, 8]} />
        <meshStandardMaterial color="#495057" />
      </mesh>

      <mesh position={[7.8, 2.0, 0]}>
        <boxGeometry args={[0.3, 1.5, 36]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
      <mesh position={[-7.8, 2.0, 0]}>
        <boxGeometry args={[0.3, 1.5, 36]} />
        <meshStandardMaterial color="#e63946" />
      </mesh>
    </group>
  );
}

// 🌞 REAL-WORLD SUN & SKY SYSTEM
function DynamicSkyAndLighting({ setIsNight, aiEvent }) {
  const sunRef = useRef();
  const dirLightRef = useRef();
  const skyColorRef = useRef(new THREE.Color("#87ceeb"));

  useFrame((state, delta) => {
    const rawTime = state.clock.getElapsedTime();
    const cycleDuration = 720;
    const progress = (rawTime % cycleDuration) / cycleDuration;
    
    let angle;
    if (progress < 0.2) {
      angle = THREE.MathUtils.lerp(0.05, 0.35, progress / 0.2);
    } else if (progress < 0.5) {
      angle = THREE.MathUtils.lerp(0.35, Math.PI - 0.05, (progress - 0.2) / 0.3);
    } else if (progress < 0.7) {
      angle = THREE.MathUtils.lerp(Math.PI - 0.05, Math.PI + 0.05, (progress - 0.5) / 0.2);
    } else {
      angle = THREE.MathUtils.lerp(Math.PI + 0.1, Math.PI * 2 - 0.1, (progress - 0.7) / 0.3);
    }

    const sunRadius = 520;
    const x = Math.cos(angle) * sunRadius;
    const y = Math.sin(angle) * sunRadius;
    const z = Math.sin(angle * 0.5) * (sunRadius * 0.5);

    if (sunRef.current) sunRef.current.position.set(x, y, z);
    if (dirLightRef.current) dirLightRef.current.position.set(x, y, z);

    const isNightNow = y < 0;
    setIsNight(isNightNow);

    let targetSky, targetLight, targetIntensity;

    if (y > 55) {
      if (aiEvent === 'SUMMER') {
        targetSky = new THREE.Color("#4ea8de");
        targetLight = new THREE.Color("#fff3b0");
        targetIntensity = 2.5;
      } else if (aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM') {
        targetSky = new THREE.Color("#495057");
        targetLight = new THREE.Color("#8d99ae");
        targetIntensity = 0.8;
      } else {
        targetSky = new THREE.Color("#87ceeb");
        targetLight = new THREE.Color("#ffffff");
        targetIntensity = 2.0;
      }
    } else if (y > 0) {
      const sunriseBlend = THREE.MathUtils.clamp((y + 10) / 65, 0, 1);
      targetSky = new THREE.Color("#ff7b54").lerp(new THREE.Color("#87ceeb"), sunriseBlend);
      targetLight = new THREE.Color("#ffb26b").lerp(new THREE.Color("#fff4d6"), sunriseBlend);
      targetIntensity = THREE.MathUtils.lerp(0.8, 1.8, sunriseBlend);
    } else if (y > -45) {
      const twilightBlend = THREE.MathUtils.clamp((y + 45) / 45, 0, 1);
      targetSky = new THREE.Color("#17153b").lerp(new THREE.Color("#ff7b54"), twilightBlend);
      targetLight = new THREE.Color("#4b3f72").lerp(new THREE.Color("#ffb26b"), twilightBlend);
      targetIntensity = THREE.MathUtils.lerp(0.25, 0.8, twilightBlend);
    } else {
      targetSky = new THREE.Color("#03030c");
      targetLight = new THREE.Color("#5c677d");
      targetIntensity = 0.18;
    }

    skyColorRef.current.lerp(targetSky, delta * 1.5);
    state.scene.background = skyColorRef.current;

    if (!state.scene.fog) {
      state.scene.fog = new THREE.FogExp2(skyColorRef.current.getHex(), 0.0012);
    } else {
      state.scene.fog.color.copy(skyColorRef.current);
    }

    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(targetLight, delta * 1.5);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, targetIntensity, delta * 1.5);
    }
  });

  return (
    <>
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color={aiEvent === 'SUMMER' ? "#ff9f1c" : "#ffea00"} />
      </mesh>
    </>
  );
}

// 🛤️🛣️ আধুনিক রোডস (Y-Position বাড়িয়ে ২.৫ ইউনিট উঁচুতে তোলা হয়েছে)
function AdvancedRoadNetwork({ isNight }) {
  return (
    // 🟢 সমতল ground-এর উপর road surface-এর নিচের অংশ বসানো হয়েছে
    <group position={[0, 0.4, 0]}>
      
      {/* ১. উত্তর-দক্ষিণ হাইওয়ে A */}
      <group position={[35, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[16, 0.8, 500]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[-9, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.9, 500]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        <mesh position={[9, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.9, 500]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, -240 + i * 12]}>
            <planeGeometry args={[0.4, 6]} />
            <meshBasicMaterial color="#ffbe0b" />
          </mesh>
        ))}
      </group>

      {/* ২. উত্তর-দক্ষিণ হাইওয়ে B */}
      <group position={[-35, 0, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[16, 0.8, 500]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[-9, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.9, 500]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        <mesh position={[9, 0.1, 0]}>
          <boxGeometry args={[2.5, 0.9, 500]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, -240 + i * 12]}>
            <planeGeometry args={[0.4, 6]} />
            <meshBasicMaterial color="#ffbe0b" />
          </mesh>
        ))}
      </group>

      {/* ৩. পূর্ব-পশ্চিম কানেক্টিং রোড A */}
      <group position={[0, 0.05, -70]}>
        <mesh receiveShadow>
          <boxGeometry args={[500, 0.8, 16]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[0, 0.1, -9]}>
          <boxGeometry args={[500, 0.9, 2.5]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 9]}>
          <boxGeometry args={[500, 0.9, 2.5]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-240 + i * 12, 0.41, 0]}>
            <planeGeometry args={[6, 0.4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* ৪. পূর্ব-পশ্চিম কানেক্টিং রোড B */}
      <group position={[0, 0.05, 70]}>
        <mesh receiveShadow>
          <boxGeometry args={[500, 0.8, 16]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[0, 0.1, -9]}>
          <boxGeometry args={[500, 0.9, 2.5]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.1, 9]}>
          <boxGeometry args={[500, 0.9, 2.5]} />
          <meshStandardMaterial color="#9ea93f" roughness={0.9} />
        </mesh>
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-240 + i * 12, 0.41, 0]}>
            <planeGeometry args={[6, 0.4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* চার পাশের রাস্তায় ফুটপাত ও পরিষ্কার সাদা/হলুদ edge marking */}
      <group position={[0, 0.5, 0]}>
        {[-45, -25, 25, 45].map((x, i) => (
          <mesh key={`vertical-sidewalk-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0, 0]} receiveShadow>
            <planeGeometry args={[2.2, 500]} />
            <meshStandardMaterial color="#adb5bd" roughness={0.8} />
          </mesh>
        ))}
        {[-80, -60, 60, 80].map((z, i) => (
          <mesh key={`horizontal-sidewalk-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
            <planeGeometry args={[500, 2.2]} />
            <meshStandardMaterial color="#adb5bd" roughness={0.8} />
          </mesh>
        ))}
        {[-44, -26, 26, 44].map((x, i) => (
          <mesh key={`yellow-edge-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
            <planeGeometry args={[0.22, 500]} />
            <meshBasicMaterial color="#ffbe0b" />
          </mesh>
        ))}
        {[-79, -61, 61, 79].map((z, i) => (
          <mesh key={`white-edge-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
            <planeGeometry args={[500, 0.22]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* বাইরের সংযোগ-লুপ: প্রতিটি প্রধান রাস্তার endpoint একই network-এ যুক্ত থাকে */}
      <group>
        <mesh position={[0, 0.05, -245]} receiveShadow>
          <boxGeometry args={[500, 0.8, 12]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[0, 0.05, 245]} receiveShadow>
          <boxGeometry args={[500, 0.8, 12]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[-245, 0.05, 0]} receiveShadow>
          <boxGeometry args={[12, 0.8, 500]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>
        <mesh position={[245, 0.05, 0]} receiveShadow>
          <boxGeometry args={[12, 0.8, 500]} />
          <meshStandardMaterial color="#1f2421" />
        </mesh>

        {/* boundary road-এর দুই পাশে decorative footpath */}
        {[-253, -237, 237, 253].map((z, i) => (
          <group key={`boundary-horizontal-path-${i}`}>
            <mesh position={[0, 0.5, z]} receiveShadow>
              <boxGeometry args={[520, 0.35, 4]} />
              <meshStandardMaterial color="#ced4da" roughness={0.75} />
            </mesh>
            {Array.from({ length: 26 }).map((_, tile) => (
              <mesh key={tile} position={[-250 + tile * 20, 0.7, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.18, 3.6]} />
                <meshBasicMaterial color="#8d99ae" />
              </mesh>
            ))}
          </group>
        ))}
        {[-253, -237, 237, 253].map((x, i) => (
          <group key={`boundary-vertical-path-${i}`}>
            <mesh position={[x, 0.5, 0]} receiveShadow>
              <boxGeometry args={[4, 0.35, 520]} />
              <meshStandardMaterial color="#ced4da" roughness={0.75} />
            </mesh>
            {Array.from({ length: 26 }).map((_, tile) => (
              <mesh key={tile} position={[x, 0.7, -250 + tile * 20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.6, 0.18]} />
                <meshBasicMaterial color="#8d99ae" />
              </mesh>
            ))}
          </group>
        ))}

        {/* boundary road-এর মাঝখানে alternating yellow/white center marking */}
        {[-245, 245].map((z, roadIndex) => (
          <group key={`horizontal-center-marking-${roadIndex}`}>
            {Array.from({ length: 25 }).map((_, i) => (
              <mesh key={i} position={[-240 + i * 20, 0.52, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 0.38]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#ffbe0b" : "#ffffff"} />
              </mesh>
            ))}
          </group>
        ))}
        {[-245, 245].map((x, roadIndex) => (
          <group key={`vertical-center-marking-${roadIndex}`}>
            {Array.from({ length: 25 }).map((_, i) => (
              <mesh key={i} position={[x, 0.52, -240 + i * 20]}>
                <boxGeometry args={[0.38, 0.05, 10]} />
                <meshBasicMaterial color={i % 2 === 0 ? "#ffbe0b" : "#ffffff"} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

// 🏞️ পরিবেশ
function Environment({ isNight, setIsNight, aiEvent }) {
  const getGroundColor = () => {
    if (aiEvent === 'WINTER' || aiEvent === 'SNOWFALL') return "#e9ecef";
    if (aiEvent === 'SUMMER') return "#b5838d";
    if (aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM') return "#1b4332"; 
    if (aiEvent === 'AUTUMN') return "#6b705c";
    if (aiEvent === 'LATE_AUTUMN') return "#a3b18a";
    if (aiEvent === 'SPRING') return "#52b788";
    return isNight ? "#1b4332" : "#2d6a4f";
  };

  return (
    <group>
      <ambientLight intensity={isNight ? 0.25 : 0.65} />
      <DynamicSkyAndLighting setIsNight={setIsNight} aiEvent={aiEvent} />
      <ShootingStars isNight={isNight} />

      {isNight && (
        <>
          <CrescentMoon />
          <StarConstellations />
          {[...Array(150)].map((_, i) => (
            <mesh key={i} position={[(Math.sin(i * 10) * 0.5) * 320, 50 + (i % 30), (Math.cos(i * 10) * 0.5) * 320]}>
              <sphereGeometry args={[0.18, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </>
      )}

      <WeatherEffects aiEvent={aiEvent} />
      <ModernParkGarden isNight={isNight} aiEvent={aiEvent} />
      <DynamicClouds isNight={isNight} aiEvent={aiEvent} />
      <AirTraffic isNight={isNight} />
      <BirdsInSky />
      <NorthIceMountainRange isNight={isNight} />
      <NorthMountainCloudWeather isNight={isNight} aiEvent={aiEvent} />
      <DynamicLake isNight={isNight} />
      <MetroAreaLake isNight={isNight} aiEvent={aiEvent} />
      <DenseForestZone aiEvent={aiEvent} />
      <DetailedGroundField aiEvent={aiEvent} />
      <DynamicRiver isNight={isNight} />
      <NorthRiverBridge />

      {/* 🏡 ক্যালিফোর্নিয়ার এস্টেট রেসিডেন্সিয়াল নেইবারহুড A, B, C, D (East, West, North, South) */}
      <ModernResidentialNeighborhood position={[140, 0, -20]} rotation={[0, -Math.PI / 2, 0]} isNight={isNight} aiEvent={aiEvent} />
      <ModernResidentialNeighborhood position={[140, 0, 40]} rotation={[0, -Math.PI / 2, 0]} isNight={isNight} aiEvent={aiEvent} />
      <ModernResidentialNeighborhood position={[-140, 0, -20]} rotation={[0, Math.PI / 2, 0]} isNight={isNight} aiEvent={aiEvent} />
      <ModernResidentialNeighborhood position={[-140, 0, 40]} rotation={[0, Math.PI / 2, 0]} isNight={isNight} aiEvent={aiEvent} />

      <MovingCar startZ={-100} speed={22} color="#e63946" posX={35} brand="Ferrari" />
      <MovingCar startZ={30} speed={28} color="#f8f9fa" posX={35} brand="Rolls-Royce" />
      <MovingCar startZ={-60} speed={24} color="#06d6a0" posX={-35} brand="BMW" />
      <MovingCar startZ={-140} speed={20} color="#3a86ff" posX={-70} brand="Mercedes-Benz" axis="x" />

      {/* city grid traffic: সব প্রধান রাস্তা ও দুই direction */}
      <MovingCar startZ={-170} speed={18} color="#343a40" posX={35} brand="Jeep" direction={-1} />
      <MovingCar startZ={120} speed={21} color="#e9c46a" posX={-35} brand="Mercedes-Benz" direction={-1} />
      <MovingCar startZ={-70} speed={20} color="#d62828" posX={-110} brand="Ferrari" />
      <MovingCar startZ={70} speed={17} color="#f8f9fa" posX={110} brand="Rolls-Royce" direction={-1} />
      <MovingCar startZ={-180} speed={19} color="#4361ee" posX={-70} brand="BMW" axis="x" />
      <MovingCar startZ={90} speed={23} color="#2a9d8f" posX={70} brand="Jeep" axis="x" direction={-1} />
      <MovingCar startZ={-30} speed={16} color="#ffb703" posX={-35} brand="Mercedes-Benz" direction={-1} />
      <MovingCar startZ={150} speed={22} color="#7209b7" posX={35} brand="BMW" />

      {/* প্রতিটি vertical ও horizontal city lane-এ সব ব্র্যান্ডের দুই দিকের traffic */}
      {[
        { axis: "z", posX: -35, startZ: -220 },
        { axis: "z", posX: 35, startZ: 220 },
        { axis: "x", startZ: -220, posX: -70, roadLane: -70 },
        { axis: "x", startZ: 220, posX: 70, roadLane: 70 }
      ].flatMap((laneConfig, laneIndex) =>
        [
          ["BMW", "#06d6a0"],
          ["Mercedes-Benz", "#3a86ff"],
          ["Rolls-Royce", "#f8f9fa"],
          ["Jeep", "#9c6644"],
          ["Ferrari", "#e63946"]
        ].flatMap(([brand, color], brandIndex) => [
          <MovingCar
            key={`city-lane-${laneIndex}-${brandIndex}-forward`}
            {...laneConfig}
            speed={15 + brandIndex * 2}
            color={color}
            brand={brand}
            direction={1}
          />,
          <MovingCar
            key={`city-lane-${laneIndex}-${brandIndex}-reverse`}
            {...laneConfig}
            startZ={laneConfig.axis === "z" ? -laneConfig.startZ : -laneConfig.posX}
            posX={laneConfig.axis === "z" ? laneConfig.posX : laneConfig.posX}
            speed={14 + brandIndex * 2}
            color={color}
            brand={brand}
            direction={-1}
          />
        ])
      )}

      {/* boundary loop traffic: চার পাশ ও দুই direction */}
      <MovingCar startZ={-245} speed={24} color="#e63946" posX={-220} brand="Ferrari" axis="x" lane="boundary" />
      <MovingCar startZ={245} speed={20} color="#f8f9fa" posX={220} brand="Rolls-Royce" axis="x" direction={-1} lane="boundary" />
      <MovingCar startZ={-245} speed={18} color="#343a40" posX={80} brand="Jeep" axis="x" direction={-1} lane="boundary" />
      <MovingCar startZ={245} speed={22} color="#06d6a0" posX={-80} brand="BMW" axis="x" lane="boundary" />
      <MovingCar startZ={-200} speed={21} color="#3a86ff" posX={-245} brand="Mercedes-Benz" direction={-1} lane="boundary" />
      <MovingCar startZ={160} speed={19} color="#d62828" posX={245} brand="Ferrari" lane="boundary" />
      <MovingCar startZ={80} speed={23} color="#ffb703" posX={-245} brand="Jeep" lane="boundary" />
      <MovingCar startZ={-80} speed={17} color="#7209b7" posX={245} brand="BMW" direction={-1} lane="boundary" />

      {/* সমতল মেইন গ্রাউন্ড; সব road, car ও স্থাপনা এই y=0 level অনুসরণ করে */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[900, 900, 128, 128]} />
        <meshStandardMaterial 
          color={getGroundColor()} 
          roughness={aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM' ? 0.2 : 0.9}
        />
      </mesh>

      {/* আধুনিক রোড নেটওয়ার্ক */}
      <AdvancedRoadNetwork isNight={isNight} />
    </group>
  );
}

// 🏢 জানালা
function BuildingWindows({ rows, cols, width, height, zDepth, isNight }) {
  const windows = useMemo(() => {
    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: (c - cols / 2 + 0.5) * (width / cols),
          y: (r + 0.8) * (height / rows),
          z: zDepth / 2 + 0.02
        });
      }
    }
    return list;
  }, [rows, cols, width, height, zDepth]);

  return (
    <group>
      {windows.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, w.z]}>
          <planeGeometry args={[width / (cols * 1.8), height / (rows * 1.8)]} />
          <meshStandardMaterial
            color={isNight ? "#ffcc00" : "#caf0f8"}
            emissive={isNight ? "#ffb703" : "#000000"}
            emissiveIntensity={isNight ? 1.5 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

// ক্যাম্পাস র‍্যাপার
function BuildingCampusWrapper({ position, children, title, titleColor = "#ffffff", bounds = [40, 40] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={bounds} />
        <meshStandardMaterial color="#8d99ae" />
      </mesh>
      
      {/* {title && (
         <Text position={[0, 34, 0]} fontSize={2.2} color={titleColor} anchorX="center">
           {title}
         </Text>
      )} */}
      {children}
    </group>
  );
}

function EmpireStateBuilding({ isNight }) {
  const trim = "#d9e2ec";
  const glass = isNight ? "#1976a8" : "#168aad";
  const glassEmissive = isNight ? "#075985" : "#000000";
  const floorBands = Array.from({ length: 12 }, (_, i) => 8 + i * 3.6);
  const floorLighting = [
    { y: 5.2, color: "#fff4c2", width: 19.5 },
    { y: 9.2, color: "#f8f9fa", width: 20 },
    { y: 16.4, color: "#dff6ff", width: 20 },
    { y: 23.6, color: "#00d9ff", width: 19.8 },
    { y: 30.8, color: "#00a6fb", width: 19.4 },
    { y: 38, color: "#ff8c69", width: 19 },
    { y: 45.2, color: "#ffd166", width: 18.6 },
    { y: 52, color: "#ff4d6d", width: 16 },
    { y: 60, color: "#7b2cbf", width: 12 },
    { y: 68, color: "#c8b6ff", width: 8 },
  ];
  const windowPattern = Array.from({ length: 10 }, (_, floor) => {
    const color = floor % 2 === 0 ? "#ffd166" : "#f8f9fa";
    return Array.from({ length: 5 }, () => color);
  });

  return (
    <group>
      <mesh position={[0, 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[28, 4, 24]} />
        <meshStandardMaterial color="#343a40" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 26, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 48, 18]} />
        <meshStandardMaterial color={glass} metalness={0.7} roughness={0.18} emissive={glassEmissive} emissiveIntensity={isNight ? 0.7 : 0} />
      </mesh>
      {floorBands.map((y, i) => (
        <mesh key={`band-${i}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[21.2 - i * 0.12, 0.42, 19.2 - i * 0.1]} />
          <meshStandardMaterial color={trim} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {[-7.2, -3.6, 0, 3.6, 7.2].map((x, i) => (
        <mesh key={`front-glass-${i}`} position={[x, 27, 9.12]}>
          <boxGeometry args={[2.5, 42, 0.12]} />
          <meshStandardMaterial color={glass} metalness={0.65} roughness={0.12} emissive={glassEmissive} emissiveIntensity={isNight ? 1 : 0} />
        </mesh>
      ))}
      {[-7.2, -3.6, 0, 3.6, 7.2].map((x, i) => (
        <mesh key={`rear-glass-${i}`} position={[x, 27, -9.12]}>
          <boxGeometry args={[2.5, 42, 0.12]} />
          <meshStandardMaterial color={glass} metalness={0.65} roughness={0.12} emissive={glassEmissive} emissiveIntensity={isNight ? 1 : 0} />
        </mesh>
      ))}
      {floorLighting.map(({ y, color, width }, i) => (
        <group key={`floor-light-${i}`}>
          <mesh position={[0, y, 9.2]}>
            <boxGeometry args={[width, 0.5, 0.16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 2.2 : 0.12} />
          </mesh>
          <mesh position={[0, y, -9.2]}>
            <boxGeometry args={[width, 0.5, 0.16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 2.2 : 0.12} />
          </mesh>
        </group>
      ))}
      {windowPattern.flatMap((row, floor) =>
        row.map((color, column) => (
          <group key={`window-pattern-${floor}-${column}`}>
            <mesh position={[(column - 2) * 3.55, 8 + floor * 3.75, 9.28]}>
              <boxGeometry args={[2.35, 2.15, 0.14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 1.8 : 0.18} />
            </mesh>
            <mesh position={[(column - 2) * 3.55, 8 + floor * 3.75, -9.28]}>
              <boxGeometry args={[2.35, 2.15, 0.14]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 1.8 : 0.18} />
            </mesh>
            <mesh position={[10.28, 8 + floor * 3.75, (column - 2) * 3.55]}>
              <boxGeometry args={[0.14, 2.15, 2.35]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 1.8 : 0.18} />
            </mesh>
            <mesh position={[-10.28, 8 + floor * 3.75, (column - 2) * 3.55]}>
              <boxGeometry args={[0.14, 2.15, 2.35]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 1.8 : 0.18} />
            </mesh>
          </group>
        ))
      )}
      <mesh position={[0, 5, 9.4]}>
        <boxGeometry args={[8, 0.35, 0.22]} />
        <meshStandardMaterial color="#fff4c2" emissive="#fff4c2" emissiveIntensity={isNight ? 4 : 0.2} />
      </mesh>
      <group position={[0, 12.5, 9.4]}>
        {[[-2, 0], [0, 0], [2, 0]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0, z]}>
            <sphereGeometry args={[0.65, 12, 8]} />
            <meshStandardMaterial color="#fff0b3" emissive="#fff0b3" emissiveIntensity={isNight ? 3 : 0.15} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 52, 0]} castShadow>
        <boxGeometry args={[16, 8, 15]} />
        <meshStandardMaterial color={trim} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 60, 0]} castShadow>
        <boxGeometry args={[12, 8, 12]} />
        <meshStandardMaterial color={glass} metalness={0.7} roughness={0.15} emissive={glassEmissive} emissiveIntensity={isNight ? 0.8 : 0} />
      </mesh>
      <mesh position={[0, 68, 0]} castShadow>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color={glass} metalness={0.7} roughness={0.15} emissive={glassEmissive} emissiveIntensity={isNight ? 0.8 : 0} />
      </mesh>
      <mesh position={[0, 76, 0]} castShadow>
        <coneGeometry args={[5.5, 10, 4]} />
        <meshStandardMaterial color={trim} metalness={0.8} roughness={0.2} />
      </mesh>
      {["#ff006e", "#00f5d4", "#fee440", "#7b2cbf"].map((color, i) => (
        <mesh key={`roof-rgb-${i}`} position={[(i - 1.5) * 2.6, 80.5, 0]}>
          <boxGeometry args={[2.1, 0.35, 7]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isNight ? 3 : 0.15} />
        </mesh>
      ))}
      <mesh position={[0, 88, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.8, 16, 12]} />
        <meshStandardMaterial
          color="#adb5bd"
          metalness={0.9}
          roughness={0.2}
          emissive={isNight ? "#ff304f" : "#000000"}
          emissiveIntensity={isNight ? 2 : 0}
        />
      </mesh>
      <mesh position={[0, 96, 0]}>
        <sphereGeometry args={[1.2, 12, 8]} />
        <meshStandardMaterial color="#ff304f" emissive="#ff304f" emissiveIntensity={isNight ? 5 : 1} />
      </mesh>

      {[[-10, 0], [10, 0], [0, -9], [0, 9]].map(([x, z], i) => (
        <mesh key={i} position={[x, 4.2, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.5, 2.2]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
      ))}
      {isNight && <pointLight position={[0, 88, 0]} color="#ff304f" intensity={4} distance={25} />}
    </group>
  );
}

// 🏙️ ডাউনটাউন স্কাইস্ক্রেপার
function DowntownSkyscraper({ isNight, variant = "A", aiEvent }) {
  const snowRoof = aiEvent === 'WINTER' || aiEvent === 'SNOWFALL';
  return (
    <group>
      {variant === "A" ? (
        <>
          <group position={[-8, 0, -4]}>
            <mesh position={[0, 28, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[5.5, 6.5, 56, 24]} />
              <meshStandardMaterial color="#003049" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 60, 0]} castShadow>
              <coneGeometry args={[5.5, 12, 24]} />
              <meshStandardMaterial color={snowRoof ? "#ffffff" : "#00b4d8"} emissive={isNight ? "#00b4d8" : "#000000"} emissiveIntensity={isNight ? 1.8 : 0.3} />
            </mesh>
          </group>

          <group position={[8, 0, 5]}>
            <mesh position={[0, 24, 0]} castShadow receiveShadow>
              <boxGeometry args={[9, 48, 9]} />
              <meshStandardMaterial color="#2b2d42" />
            </mesh>
            <BuildingWindows rows={18} cols={3} width={9} height={48} zDepth={9} isNight={isNight} />
          </group>
        </>
      ) : (
        <>
          <group position={[-7, 0, 0]}>
            <mesh position={[0, 30, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 60, 8]} />
              <meshStandardMaterial color="#1d3557" />
            </mesh>
            <BuildingWindows rows={20} cols={3} width={8} height={60} zDepth={8} isNight={isNight} />
          </group>

          <group position={[7, 0, 0]}>
            <mesh position={[0, 30, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 60, 8]} />
              <meshStandardMaterial color="#1d3557" />
            </mesh>
            <BuildingWindows rows={20} cols={3} width={8} height={60} zDepth={8} isNight={isNight} />
          </group>
        </>
      )}
    </group>
  );
}

// 🛍️ শপিং মল
function ShoppingMall({ isNight }) {
  return (
    <group>
      <mesh position={[0, 16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[14, 16, 32, 32]} />
        <meshStandardMaterial color="#00b4d8" metalness={0.8} roughness={0.15} transparent opacity={0.85} />
      </mesh>

      {[8, 16, 24].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]}>
          <torusGeometry args={[15.2, 0.4, 16, 50]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#f72585" emissive="#f72585" emissiveIntensity={isNight ? 2.5 : 0.5} />
        </mesh>
      ))}

      <mesh position={[0, 32, 0]}>
        <sphereGeometry args={[12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffb703" metalness={0.9} roughness={0.1} emissive={isNight ? "#ffb703" : "#000"} emissiveIntensity={isNight ? 1.5 : 0.2} />
      </mesh>
      <mesh position={[0, 3, 15]}>
        <boxGeometry args={[10, 6, 4]} />
        <meshStandardMaterial color="#2b2d42" />
      </mesh>
    </group>
  );
}

// 🏭 ৭. আধুনিক ও বড় ফ্যাক্টরি (Modernized Factory Complex with Smoke)
function FactoryDowntown({ isNight }) {
  return (
    <group>
      <group position={[-12, 0, 0]}>
        <mesh position={[0, 12, 0]} castShadow receiveShadow>
          <boxGeometry args={[20, 24, 22]} />
          <meshStandardMaterial color="#343a40" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* চিমনি ১ ও সাদা ধোঁয়া */}
        <mesh position={[4, 26, -5]} castShadow>
          <cylinderGeometry args={[1.5, 2.2, 28]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <FactorySmoke position={[4, 40, -5]} />

        {/* চিমনি ২ ও সাদা ধোঁয়া */}
        <mesh position={[-5, 26, 4]} castShadow>
          <cylinderGeometry args={[1.5, 2.2, 28]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <FactorySmoke position={[-5, 40, 4]} />
      </group>

      <group position={[12, 0, 0]}>
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 20, 20]} />
          <meshStandardMaterial color="#495057" metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// 🏥 ৮. বড় ও আধুনিক হাসপাতাল ক্যাম্পাস (Expanded Modern Hospital & Garden Campus)
function Hospital({ isNight }) {
  return (
    <group>
      {/* মেইন টাওয়ার */}
      <mesh position={[0, 18, -8]} castShadow receiveShadow>
        <boxGeometry args={[32, 36, 26]} />
        <meshStandardMaterial color="#f8f9fa" metalness={0.2} roughness={0.2} />
      </mesh>

      {/* হেলিপ্যাড চূড়া (Helipad) */}
      <mesh position={[0, 37, -8]} castShadow>
        <cylinderGeometry args={[7, 7, 1, 32]} />
        <meshStandardMaterial color="#d62828" />
      </mesh>
      {/* <Text position={[0, 37.8, -8]} rotation={[-Math.PI / 2, 0, 0]} fontSize={4.5} color="#ffffff" anchorX="center" anchorY="middle">
        H
      </Text> */}

      {/* এমার্জেন্সি উইং (Emergency Wing) - বড় করা হয়েছে */}
      <mesh position={[18, 10, 6]} castShadow receiveShadow>
        <boxGeometry args={[18, 20, 20]} />
        <meshStandardMaterial color="#e9ecef" />
      </mesh>

      {/* ডায়াগনস্টিক্স উইং (Diagnostics Wing) - নতুন সংযোজন */}
      <mesh position={[-18, 10, 6]} castShadow receiveShadow>
        <boxGeometry args={[16, 20, 18]} />
        <meshStandardMaterial color="#dff6ff" />
      </mesh>

      {/* রেড ক্রস সাইন (Red Cross Glow) */}
      <mesh position={[0, 28, 8]}>
        <boxGeometry args={[3, 10, 0.2]} />
        <meshStandardMaterial color="#d62828" emissive={isNight ? "#ff0000" : "#d62828"} emissiveIntensity={isNight ? 2 : 0.5} />
      </mesh>
      <mesh position={[0, 28, 8]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#d62828" emissive={isNight ? "#ff0000" : "#d62828"} emissiveIntensity={isNight ? 2 : 0.5} />
      </mesh>

      {/* হাসপাতাল ক্যাম্পাস গার্ডেন (Inner Hospital Garden with Flower Trees) */}
      <BigFlowerTree position={[-20, 0, 12]} flowerColor="#ff4d6d" />
      <BigFlowerTree position={[-10, 0, 16]} flowerColor="#ffb703" />
      <BigFlowerTree position={[10, 0, 16]} flowerColor="#e63946" />
      <BigFlowerTree position={[20, 0, 12]} flowerColor="#7209b7" />

      {/* গার্ডেন রেইলিং ও সাইডপাথ */}
      <mesh position={[0, 0.5, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[40, 1.5, 0.1]} />
        <meshStandardMaterial color="#d9c2a3" roughness={0.8} />
      </mesh>

      <BuildingWindows rows={9} cols={9} width={32} height={36} zDepth={26} isNight={isNight} />
    </group>
  );
}

// 🏡 রেসিডেন্সিয়াল হাউজ
function ResidentialHouse({ color = "#f4a261", roofColor = "#e63946", isNight, aiEvent }) {
  const isSnow = aiEvent === 'WINTER' || aiEvent === 'SNOWFALL';
  const finalRoofColor = isSnow ? "#ffffff" : roofColor;

  return (
    <group>
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 7, 7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 8.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[5.8, 3.5, 4]} />
        <meshStandardMaterial color={finalRoofColor} />
      </mesh>
      <BuildingWindows rows={2} cols={2} width={7} height={7} zDepth={7} isNight={isNight} />
    </group>
  );
}

// 🏘️ টাউনহাউস
function TownhouseNeighborhood({ isNight, aiEvent }) {
  return (
    <group position={[0, 0, 0]}>
      <group position={[-12, 0, 0]}>
        <ResidentialHouse color="#f4a261" roofColor="#e63946" isNight={isNight} aiEvent={aiEvent} />
      </group>
      <group position={[0, 0, 0]}>
        <ResidentialHouse color="#2a9d8f" roofColor="#e76f51" isNight={isNight} aiEvent={aiEvent} />
      </group>
      <group position={[12, 0, 0]}>
        <ResidentialHouse color="#e9c46a" roofColor="#1d3557" isNight={isNight} aiEvent={aiEvent} />
      </group>
    </group>
  );
}

// 🎓 বিশ্ববিদ্যালয় ক্যাম্পাস
function University({ isNight }) {
  const campusTrees = [
    [-38, -26, "#ff70a6"], [-38, 2, "#ffb703"], [-38, 30, "#e63946"],
    [38, -26, "#ffb703"], [38, 2, "#ff70a6"], [38, 30, "#e63946"],
    [-18, 30, "#7209b7"], [18, 30, "#ffb703"]
  ];

  const renderTree = ([x, z, flowerColor], index) => (
    <group key={`campus-tree-${index}`} position={[x, 0, z]}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.6, 6, 8]} />
        <meshStandardMaterial color="#6b4226" />
      </mesh>
      <mesh position={[0, 6.4, 0]} castShadow>
        <sphereGeometry args={[2.7, 12, 8]} />
        <meshStandardMaterial color="#2d6a4f" />
      </mesh>
      <mesh position={[0.7, 7.5, 0.2]}>
        <sphereGeometry args={[0.8, 10, 8]} />
        <meshStandardMaterial color={flowerColor} emissive={isNight ? flowerColor : "#000000"} emissiveIntensity={isNight ? 1.3 : 0} />
      </mesh>
    </group>
  );

  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]} receiveShadow>
        <planeGeometry args={[104, 78]} />
        <meshStandardMaterial color="#315c45" roughness={0.85} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 2]}>
        <circleGeometry args={[16, 48]} />
        <meshStandardMaterial color={isNight ? "#023e8a" : "#0096c7"} roughness={0.18} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.55, 2]}>
        <cylinderGeometry args={[2.2, 2.8, 1.1, 24]} />
        <meshStandardMaterial color="#d8f3dc" />
      </mesh>

      {[[-27, 0, 0], [27, 0, 0], [0, -25, 0]].map(([x, z], index) => (
        <mesh key={`campus-walkway-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.06, z + 2]}>
          <boxGeometry args={index === 2 ? [9, 48, 0.08] : [42, 8, 0.08]} />
          <meshStandardMaterial color="#d9c2a3" roughness={0.8} />
        </mesh>
      ))}
      {[-14, 0, 14].map((x, index) => (
        <group key={`campus-lamp-${index}`} position={[x, 0, 21]}>
          <mesh position={[0, 2.7, 0]}>
            <cylinderGeometry args={[0.1, 0.18, 5.4, 8]} />
            <meshStandardMaterial color="#263238" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 5.5, 0]}>
            <sphereGeometry args={[0.35, 10, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 3 : 0.2} />
          </mesh>
          {isNight && <pointLight position={[0, 5.5, 0]} color="#fef08a" intensity={1.4} distance={14} />}
        </group>
      ))}

      {[
        { position: [-27, 0, -18], size: [20, 16, 12], color: "#1d3557" },
        { position: [27, 0, -18], size: [20, 16, 12], color: "#457b9d" },
        { position: [0, 0, 28], size: [42, 13, 10], color: "#264653" }
      ].map((building, index) => (
        <group key={`campus-building-${index}`} position={building.position}>
          <mesh position={[0, 8, 0]} castShadow receiveShadow>
            <boxGeometry args={[building.size[0], building.size[1], building.size[2]]} />
            <meshStandardMaterial color={building.color} metalness={0.7} roughness={0.18} />
          </mesh>
          <mesh position={[0, 8, building.size[2] / 2 + 0.06]}>
            <planeGeometry args={[building.size[0] * 0.82, building.size[1] * 0.72]} />
            <meshStandardMaterial color="#caf0f8" metalness={0.8} roughness={0.08} transparent opacity={0.78} />
          </mesh>
          <BuildingWindows rows={4} cols={index === 2 ? 9 : 5} width={building.size[0] * 0.82} height={building.size[1] - 2} zDepth={building.size[2]} isNight={isNight} />
        </group>
      ))}

      <group position={[0, 0, -10]}>
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[26, 20, 14]} />
          <meshStandardMaterial color="#7f5539" roughness={0.4} />
        </mesh>
        <mesh position={[0, 10, 7.05]}>
          <planeGeometry args={[17, 16]} />
          <meshStandardMaterial color="#caf0f8" metalness={0.8} opacity={0.7} transparent />
        </mesh>
        {[-10, -5, 0, 5, 10].map((x, i) => (
          <mesh key={i} position={[x, 8, 7.5]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 16]} />
            <meshStandardMaterial color="#e63946" />
          </mesh>
        ))}
        <mesh position={[0, 22, 0]} castShadow>
          <boxGeometry args={[7, 8, 7]} />
          <meshStandardMaterial color="#9c6644" />
        </mesh>
        <mesh position={[0, 28, 0]} castShadow>
          <sphereGeometry args={[4, 32, 16]} />
          <meshStandardMaterial color="#e9c46a" metalness={0.8} emissive={isNight ? "#e9c46a" : "#000"} emissiveIntensity={isNight ? 1.2 : 0} />
        </mesh>
        <mesh position={[0, 33, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>
      {campusTrees.map(renderTree)}
    </group>
  );
}

// 💡 ল্যাম্পপোস্ট ও গাছপালা
function RoadsideVegetationAndLamps({ isNight }) {
  const roadsidePositions = useMemo(() => [
    [-38, -120], [-38, -50], [-38, 50], [-38, 120],
    [38, -120], [38, -50], [38, 50], [38, 120],
    [-120, -78], [-40, -78], [40, -78], [120, -78],
    [-120, 78], [-40, 78], [40, 78], [120, 78],
    [-200, -253], [-100, -253], [0, -253], [100, -253], [200, -253],
    [-200, -237], [-100, -237], [0, -237], [100, -237], [200, -237],
    [-200, 253], [-100, 253], [0, 253], [100, 253], [200, 253],
    [-200, 237], [-100, 237], [0, 237], [100, 237], [200, 237],
    [-253, -180], [-253, -60], [-253, 60], [-253, 180],
    [-237, -180], [-237, -60], [-237, 60], [-237, 180],
    [253, -180], [253, -60], [253, 60], [253, 180],
    [237, -180], [237, -60], [237, 60], [237, 180]
  ], []);

  return (
    <group>
      {roadsidePositions.map((pos, i) => (
        <group key={i} position={[pos[0], 0, pos[1]]}>
          <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.25, 0.5, 6]} /><meshStandardMaterial color="#3d2314" /></mesh>
          <mesh position={[0, 6.5, 0]} castShadow><dodecahedronGeometry args={[2.4]} /><meshStandardMaterial color="#2d6a4f" flatShading /></mesh>
          <mesh position={[-1.5, 3.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 7]} /><meshStandardMaterial color="#212529" /></mesh>
          <mesh position={[-1.5, 7, 0]}><sphereGeometry args={[0.35, 16, 16]} /><meshStandardMaterial color={isNight ? "#ffea00" : "#555555"} emissive={isNight ? "#ffcc00" : "#000000"} emissiveIntensity={isNight ? 3 : 0} /></mesh>
          {isNight && <pointLight position={[-1.5, 6.8, 0]} intensity={4} distance={20} color="#ffdd66" />}
        </group>
      ))}
    </group>
  );
}

// 🚆 মেট্রোরেল
function MetroRail({ isNight }) {
  const trainRef = useRef();
  const progressRef = useRef(0);
  const trackCenter = [-285, 0];
  // পশ্চিমের ভবন, মল, পাহাড় ও জঙ্গলকে ভেতরে রেখে চারপাশে loop
  const trackWidth = 180;
  const trackDepth = 380;
  const halfWidth = trackWidth / 2;
  const halfDepth = trackDepth / 2;

  useFrame((_, delta) => {
    if (trainRef.current) {
      progressRef.current = (progressRef.current + delta * 0.035) % 1;
      const progress = progressRef.current;
      const perimeter = (trackWidth + trackDepth) * 2;
      const distance = progress * perimeter;
      let x;
      let z;
      let rotation;
      if (distance < trackWidth) {
        x = halfWidth - distance;
        z = -halfDepth;
        rotation = Math.PI / 2;
      } else if (distance < trackWidth + trackDepth) {
        x = -halfWidth;
        z = -halfDepth + (distance - trackWidth);
        rotation = 0;
      } else if (distance < trackWidth * 2 + trackDepth) {
        x = -halfWidth + (distance - trackWidth - trackDepth);
        z = halfDepth;
        rotation = -Math.PI / 2;
      } else {
        x = halfWidth;
        z = halfDepth - (distance - trackWidth * 2 - trackDepth);
        rotation = Math.PI;
      }
      trainRef.current.position.set(trackCenter[0] + x, 16, trackCenter[1] + z);
      trainRef.current.rotation.y = rotation;
    }
  });

  const pillarPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 8; i++) {
      const x = -halfWidth + i * (trackWidth / 7);
      positions.push([trackCenter[0] + x, trackCenter[1] - halfDepth]);
      positions.push([trackCenter[0] + x, trackCenter[1] + halfDepth]);
    }
    for (let i = 1; i < 6; i++) {
      const z = -halfDepth + i * (trackDepth / 6);
      positions.push([trackCenter[0] - halfWidth, trackCenter[1] + z]);
      positions.push([trackCenter[0] + halfWidth, trackCenter[1] + z]);
    }
    return positions;
  }, []);

  return (
    <group>
      {/* পশ্চিম পাশের পাহাড় ও জঙ্গল ঘিরে elevated rectangular metro track */}
      <group position={[trackCenter[0], 14.2, trackCenter[1]]}>
        <mesh position={[0, 0, -halfDepth]} castShadow receiveShadow>
          <boxGeometry args={[trackWidth, 0.5, 4.5]} />
          <meshStandardMaterial color="#212529" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, halfDepth]} castShadow receiveShadow>
          <boxGeometry args={[trackWidth, 0.5, 4.5]} />
          <meshStandardMaterial color="#212529" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[-halfWidth, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.5, 0.5, trackDepth]} />
          <meshStandardMaterial color="#212529" metalness={0.65} roughness={0.35} />
        </mesh>
        <mesh position={[halfWidth, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.5, 0.5, trackDepth]} />
          <meshStandardMaterial color="#212529" metalness={0.65} roughness={0.35} />
        </mesh>
      </group>
      {pillarPositions.map((position, i) => (
        <mesh key={i} position={[position[0], 7, position[1]]} castShadow>
          <cylinderGeometry args={[1.2, 1.2, 14]} />
          <meshStandardMaterial color="#495057" />
        </mesh>
      ))}

      <group ref={trainRef} position={[trackCenter[0] + halfWidth, 16, trackCenter[1] - halfDepth]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.4, 2.8, 24]} />
          <meshStandardMaterial color="#e9ecef" metalness={0.9} roughness={0.12} />
        </mesh>
        <mesh position={[0, 0.35, -12.2]}>
          <sphereGeometry args={[1.7, 20, 12]} />
          <meshStandardMaterial color="#d9f0ff" metalness={0.8} roughness={0.08} />
        </mesh>
        <mesh position={[0, 0.25, 12.2]}>
          <sphereGeometry args={[1.7, 20, 12]} />
          <meshStandardMaterial color="#d9f0ff" metalness={0.8} roughness={0.08} />
        </mesh>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[3.25, 0.4, 24.1]} />
          <meshStandardMaterial color="#06d6a0" emissive="#06d6a0" emissiveIntensity={isNight ? 1.0 : 0.2} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[3.46, 0.22, 23.6]} />
          <meshStandardMaterial color="#00b4d8" emissive="#00b4d8" emissiveIntensity={isNight ? 1.8 : 0.35} />
        </mesh>
        {[-8, -4, 0, 4, 8].map((z, i) => (
          <group key={`metro-door-${i}`} position={[0, 0.65, z]}>
            <mesh position={[-1.73, 0, 0]}>
              <boxGeometry args={[0.08, 1.45, 2.1]} />
              <meshStandardMaterial color="#16324f" metalness={0.7} roughness={0.15} />
            </mesh>
            <mesh position={[1.73, 0, 0]}>
              <boxGeometry args={[0.08, 1.45, 2.1]} />
              <meshStandardMaterial color="#16324f" metalness={0.7} roughness={0.15} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -1.55, 0]}>
          <boxGeometry args={[2.2, 0.25, 20]} />
          <meshStandardMaterial color="#343a40" metalness={0.85} roughness={0.2} />
        </mesh>
        {isNight && <spotLight position={[0, 0, 12]} angle={0.5} intensity={8} distance={80} color="#ffffff" />}
        {isNight && <pointLight position={[0, 0.6, 0]} intensity={3} distance={35} color="#00e5ff" />}
      </group>
    </group>
  );
}

// 🚶 মানুষ (Individual Human)
function DetailedHuman({ position, color = "#2a9d8f", rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.8, 0]} castShadow><sphereGeometry args={[0.26, 16, 16]} /><meshStandardMaterial color="#ffdbac" /></mesh>
      <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.5, 0.8, 0.3]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.45, 0.7, 0.28]} /><meshStandardMaterial color="#1d3557" /></mesh>
    </group>
  );
}

function DynamicPedestrian({ waypoints, color, speed = 2.5 }) {
  const groupRef = useRef();
  const [currentWP, setCurrentWP] = useState(0);

  useFrame((state, delta) => {
    if (!groupRef.current || waypoints.length === 0) return;
    const target = waypoints[currentWP];
    const dx = target.x - groupRef.current.position.x;
    const dz = target.z - groupRef.current.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.6) {
      setCurrentWP((prev) => (prev + 1) % waypoints.length);
    } else {
      groupRef.current.position.x += (dx / dist) * delta * speed;
      groupRef.current.position.z += (dz / dist) * delta * speed;
      groupRef.current.rotation.y = Math.atan2(dx, dz);
      groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[waypoints[0].x, 0, waypoints[0].z]}>
      <DetailedHuman position={[0, 0, 0]} color={color} />
    </group>
  );
}

// 🚶‍♂️🚶‍♀️ 50 City Roaming Pedestrians (৫০ জন মানুষ শহরে ও পার্কে ঘুরে বেড়াচ্ছে)
function FiftyCityPedestrians() {
  const crowd = useMemo(() => {
    const colors = ["#e76f51", "#2a9d8f", "#e9c46a", "#f4a261", "#d62828", "#00b4d8", "#7209b7", "#ff4d6d"];
    return Array.from({ length: 50 }, (_, i) => {
      const radius = 25 + Math.random() * 120;
      const angleStart = (i / 50) * Math.PI * 2;
      const waypoints = [
        { x: Math.cos(angleStart) * radius, z: Math.sin(angleStart) * radius },
        { x: Math.cos(angleStart + 1.2) * radius, z: Math.sin(angleStart + 1.2) * radius },
        { x: Math.cos(angleStart + 2.4) * radius, z: Math.sin(angleStart + 2.4) * radius },
        { x: Math.cos(angleStart + 4.0) * radius, z: Math.sin(angleStart + 4.0) * radius }
      ];
      return {
        waypoints,
        color: colors[i % colors.length],
        speed: 1.8 + Math.random() * 1.5
      };
    });
  }, []);

  return (
    <group>
      {crowd.map((p, idx) => (
        <DynamicPedestrian key={idx} waypoints={p.waypoints} color={p.color} speed={p.speed} />
      ))}
    </group>
  );
}

// 🔫 গুলি
function Bullets({ bullets, updateBullets }) {
  useFrame((_, delta) => {
    updateBullets(delta);
  });

  return (
    <>
      {bullets.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#ffea00" emissive="#ffea00" emissiveIntensity={4} />
        </mesh>
      ))}
    </>
  );
}

// 🎥 জুমিং কন্ট্রোল
function CameraController() {
  return (
    <OrbitControls
      makeDefault
      enableRotate={true}
      enableZoom={true}
      enablePan={true}
      screenSpacePanning={true}
      panSpeed={1.2}
      zoomSpeed={0.6}
      rotateSpeed={0.8}
      minDistance={10}
      maxDistance={850}
      target={[0, 0, 0]}
    />
  );
}

function AmbientAudio({ isNight, aiEvent }) {
  const soundsRef = useRef(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    soundsRef.current = {
      birds: new Howl({ src: [ambientAudioSources.birds], loop: true, volume: 0.18 }),
      rain: new Howl({ src: [ambientAudioSources.rain], loop: true, volume: 0.28 }),
      cars: new Howl({ src: [ambientAudioSources.cars], loop: true, volume: 0.12 })
    };

    const unlockAudio = () => {
      unlockedRef.current = true;
      Object.values(soundsRef.current).forEach((sound) => {
        if (!sound.playing()) sound.play();
      });
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      Object.values(soundsRef.current).forEach((sound) => sound.unload());
      soundsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sounds = soundsRef.current;
    if (!sounds || !unlockedRef.current) return;
    const raining = aiEvent === 'MONSOON' || aiEvent === 'RAIN_STORM';
    if (raining) {
      sounds.rain.play();
      sounds.birds.pause();
    } else {
      sounds.rain.pause();
      if (isNight) sounds.birds.pause();
      else sounds.birds.play();
    }
    sounds.cars.play();
  }, [isNight, aiEvent]);

  return null;
}

// 🎮 প্রধান অ্যাপ্লিকেশান (Complete Mega City)
export default function App() {
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 20 });
  const [bullets, setBullets] = useState([]);
  const [isNight, setIsNight] = useState(false);
  const [aiEvent, setAiEvent] = useState('NORMAL');

  // AI Director Cycle
  useEffect(() => {
    let currentTimeout;
    const seasonsCycle = [
      'NORMAL', 'RAIN_STORM', 'AUTUMN', 'LATE_AUTUMN', 'WINTER', 'SNOWFALL', 'SPRING', 'SUMMER'
    ];
    let currentIndex = 0;
    const DURATION_TIME = 120000; 

    const runSeasonCycle = () => {
      setAiEvent(seasonsCycle[currentIndex]);
      currentIndex = (currentIndex + 1) % seasonsCycle.length;
      currentTimeout = setTimeout(runSeasonCycle, DURATION_TIME);
    };

    runSeasonCycle();
    return () => clearTimeout(currentTimeout);
  }, []);

  // প্লেয়ার মুভমেন্ট ও শুটিং
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setPlayerPos((p) => ({ ...p, x: Math.max(p.x - 1.2, -180) }));
      if (e.key === 'ArrowRight' || e.key === 'd') setPlayerPos((p) => ({ ...p, x: Math.min(p.x + 1.2, 180) }));
      if (e.key === 'ArrowUp' || e.key === 'w') setPlayerPos((p) => ({ ...p, z: Math.max(p.z - 1.2, -180) }));
      if (e.key === 'ArrowDown' || e.key === 's') setPlayerPos((p) => ({ ...p, z: Math.min(p.z + 1.2, 180) }));
      if (e.key === ' ' || e.code === 'Space') {
        setBullets((prev) => [...prev, { x: playerPos.x, y: 1.2, z: playerPos.z - 0.5 }]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos]);

  const updateBullets = (delta) => {
    setBullets((prev) =>
      prev.map((b) => ({ ...b, z: b.z - delta * 35 })).filter((b) => b.z > -200)
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
     <AmbientAudio isNight={isNight} aiEvent={aiEvent} />
     <div style={{ position: 'absolute', top: 20, left: 20, color: '#ffffff', fontSize: 22, zIndex: 10, fontFamily: 'sans-serif', fontWeight: 'bold', textShadow: '2px 2px 4px black' }}>
        🏙️ Mega Downtown City (Shanghai & Petronas Towers Plaza)
        <div style={{ fontSize: 13, color: '#ffbe0b', marginTop: 5 }}>
          [W / A / S / D] Move Player | [Spacebar] Shoot | Mouse Drag (360° Free View)
        </div>
        <div style={{ fontSize: 14, color: '#06d6a0', marginTop: 5 }}>
          🤖 AI Director Season: <strong style={{ color: '#ff4d6d' }}>{aiEvent}</strong>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 80, 160], fov: 60, far: 1400 }}
        shadows={false}
        dpr={[0.75, 1]}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <Environment isNight={isNight} setIsNight={setIsNight} aiEvent={aiEvent} />

        <MetroRail isNight={isNight} />
        <RoadsideVegetationAndLamps isNight={isNight} />
        <ScenicTreeExpansion isNight={isNight} />

        {/* 🏙️ শহরের কেন্দ্রস্থলে রোড-মুক্ত সেন্ট্রাল প্লাজায় (CITY CENTER PLAZA) TOWERS */}
        <BuildingCampusWrapper position={[0, 0, 0]} title="DOWNTOWN / CITY CENTER PLAZA" titleColor="#00b4d8" bounds={[54, 46]}>
          <ShanghaiTower position={[-14, 0, 0]} isNight={isNight} />
          <PetronasTwinTowers position={[14, 0, 0]} isNight={isNight} />
        </BuildingCampusWrapper>
        <BuildingCampusWrapper position={[0, 0, -58]} title="DOWNTOWN / CITY CENTER - EMPIRE STATE BUILDING" titleColor="#ffcc00" bounds={[34, 34]}>
          <EmpireStateBuilding isNight={isNight} />
        </BuildingCampusWrapper>

        {/* 🏙️ ডাউনটাউন ডিস্ট্রিক্ট A & B */}
        <BuildingCampusWrapper position={[-62, 0, 0]} title="DOWNTOWN / CITY CENTER - FINANCIAL DISTRICT A" titleColor="#4cc9f0" bounds={[42, 42]}>
          <DowntownSkyscraper isNight={isNight} variant="A" aiEvent={aiEvent} />
        </BuildingCampusWrapper>

        <BuildingCampusWrapper position={[62, 0, 0]} title="DOWNTOWN / CITY CENTER - BUSINESS DISTRICT B" titleColor="#4cc9f0" bounds={[42, 42]}>
          <DowntownSkyscraper isNight={isNight} variant="B" aiEvent={aiEvent} />
        </BuildingCampusWrapper>

        {/* 🎓 বিশ্ববিদ্যালয় ক্যাম্পাস */}
        <BuildingCampusWrapper position={[-125, 0, -145]} title="GRAND UNIVERSITY CAMPUS" bounds={[52, 42]}>
          <University isNight={isNight} />
        </BuildingCampusWrapper>

        {/* 🏥 আধুনিক হাসপাতাল কমপ্লেক্স (Expanded Hospital Complex) */}
        <BuildingCampusWrapper position={[85, 0, -110]} title="CENTRAL HOSPITAL & HEALTH CAMPUS" titleColor="#e63946" bounds={[62, 58]}>
          <Hospital isNight={isNight} />
        </BuildingCampusWrapper>


        {/* 🛍️ শপিং মল */}
        <BuildingCampusWrapper position={[-85, 0, 110]} title="MEGA SHOPPING MALL" titleColor="#f72585" bounds={[42, 42]}>
          <ShoppingMall isNight={isNight} />
        </BuildingCampusWrapper>

        {/* 🏭 আধুনিক ফ্যাক্টরি (Modern Factory Complex) */}
        <BuildingCampusWrapper position={[85, 0, 110]} title="INDUSTRIAL FACTORY COMPLEX" titleColor="#ffb703" bounds={[48, 42]}>
          <FactoryDowntown isNight={isNight} />
        </BuildingCampusWrapper>

        {/* 🎡 প্রাচীরবেষ্টিত ও বড় গাছপালা সমৃদ্ধ থিম পার্ক (Theme Park Complex) */}
        <BuildingCampusWrapper position={[180, 0, 150]} title="AMUSEMENT THEME PARK" titleColor="#ff0054" bounds={[66, 66]}>
          <ThemeParkComplex position={[0, 0, 0]} isNight={isNight} />
        </BuildingCampusWrapper>

        {/* 🏡🏘️ রেসিডেন্সিয়াল নেইবারহুড কমপ্লেক্স (North, South, East, West) */}
        <BuildingCampusWrapper position={[0, 0, -110]} title="RESIDENTIAL NEIGHBORHOOD A" bounds={[44, 32]}>
          <TownhouseNeighborhood isNight={isNight} aiEvent={aiEvent} />
        </BuildingCampusWrapper>

        <BuildingCampusWrapper position={[0, 0, 110]} title="RESIDENTIAL NEIGHBORHOOD B" bounds={[44, 32]}>
          <TownhouseNeighborhood isNight={isNight} aiEvent={aiEvent} />
        </BuildingCampusWrapper>

        <BuildingCampusWrapper position={[140, 0, -20]} title="RESIDENTIAL NEIGHBORHOOD C" bounds={[46, 38]}>
          <TownhouseNeighborhood isNight={isNight} aiEvent={aiEvent} />
        </BuildingCampusWrapper>

        <BuildingCampusWrapper position={[-140, 0, -20]} title="RESIDENTIAL NEIGHBORHOOD D" bounds={[46, 38]}>
          <TownhouseNeighborhood isNight={isNight} aiEvent={aiEvent} />
        </BuildingCampusWrapper>

{/* 🚶 ৫০ জন মানুষ এবং প্লেয়ার */}
      {/* <FiftyCityPedestrians />
      <DetailedHuman position={[playerPos.x, 0, playerPos.z]} color="#e63946" /> */}
      {/* 💥 পোস্ট-প্রসেসিং (বন্ধ রাখা হয়েছে) */}
      {/* 
      <EffectComposer disableNormalPass>
        <Bloom
          intensity={isNight ? 1.5 : 0.35}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
        />
        <Vignette offset={0.15} darkness={0.65} />
      </EffectComposer> 
      */}

      <CameraController />

      <CityExporter />
    </Canvas>
    </div>
  );
}