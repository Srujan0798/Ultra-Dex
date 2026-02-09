import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars, Grid } from '@react-three/drei';
import * as THREE from 'three';

// Mock Data for Code City
// In a real implementation, this would come from a code analysis API
const generateCityData = (count = 50) => {
    const data = [];
    const fileTypes = ['ts', 'tsx', 'js', 'css', 'json'];
    const colors = {
        ts: '#3178c6',
        tsx: '#61dafb',
        js: '#f7df1e',
        css: '#264de4',
        json: '#a0a0a0'
    };

    for (let i = 0; i < count; i++) {
        const type = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        data.push({
            id: i,
            x: (Math.random() - 0.5) * 40,
            z: (Math.random() - 0.5) * 40,
            height: Math.random() * 5 + 1, // Lines of Code
            type,
            color: colors[type],
            name: `file_${i}.${type}`,
            complexity: Math.random() // width
        });
    }
    return data;
};

const Building = ({ position, height, color, name, complexity }) => {
    const mesh = useRef();
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        if (active) {
            mesh.current.rotation.y += delta;
        }
    });

    return (
        <group position={position}>
            {/* Building Mesh */}
            <mesh
                ref={mesh}
                position={[0, height / 2, 0]}
                scale={active ? 1.2 : 1}
                onClick={() => setActive(!active)}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial
                    color={hovered ? 'hotpink' : color}
                    metalness={0.5}
                    roughness={0.2}
                />
            </mesh>

            {/* Label on Hover */}
            {hovered && (
                <Text
                    position={[0, height + 1, 0]}
                    fontSize={0.5}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {name}
                </Text>
            )}
        </group>
    );
};

const Hologram = () => {
    const cityData = useMemo(() => generateCityData(60), []);

    return (
        <div className="h-full w-full bg-gray-900 text-white flex flex-col">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Project Hologram: Code City
                </h1>
                <div className="flex gap-4 text-sm text-gray-400">
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#3178c6] mr-2"></span>TS</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#61dafb] mr-2"></span>React</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#f7df1e] mr-2"></span>JS</span>
                </div>
            </div>

            <div className="flex-1 relative">
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={2} />

                    {/* Environment */}
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <Grid infiniteGrid fadeDistance={50} sectionColor="#4f4f4f" cellColor="#2f2f2f" />

                    {/* City */}
                    <group>
                        {cityData.map((building) => (
                            <Building
                                key={building.id}
                                position={[building.x, 0, building.z]}
                                height={building.height}
                                color={building.color}
                                name={building.name}
                            />
                        ))}
                    </group>

                    {/* Controls */}
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                    />
                </Canvas>

                <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs">
                    <p>Left Click: Inspect | Right Click: Pan | Scroll: Zoom</p>
                </div>
            </div>
        </div>
    );
};

export default Hologram;
