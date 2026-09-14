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