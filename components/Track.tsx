import React from 'react';
import { usePlane, useBox } from '@react-three/cannon';
import { useTexture } from '@react-three/drei';

const Wall = (props: any) => {
  // Properly destructure ref to attach to mesh
  const [ref] = useBox(() => ({ type: 'Static', ...props }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color="#444" roughness={0.5} />
    </mesh>
  );
};

export const Track = () => {
  // Floor
  const [ref] = usePlane(() => ({ 
    type: 'Static', 
    rotation: [-Math.PI / 2, 0, 0],
    material: { friction: 0.1, restitution: 0 } 
  }));

  return (
    <group>
      <mesh ref={ref} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
        <gridHelper args={[500, 50, 0x444444, 0x222222]} rotation={[-Math.PI/2, 0, 0]} />
      </mesh>

      {/* Outer Walls */}
      <Wall position={[0, 1, -50]} args={[200, 2, 2]} />
      <Wall position={[0, 1, 50]} args={[200, 2, 2]} />
      <Wall position={[-100, 1, 0]} args={[2, 2, 100]} />
      <Wall position={[100, 1, 0]} args={[2, 2, 100]} />

      {/* Start Line */}
      <mesh position={[0, 0.01, 20]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </group>
  );
};