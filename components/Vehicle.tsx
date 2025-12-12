import React, { useEffect, useRef, useState, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRaycastVehicle, useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { CarDef, CarStats } from '../types';
import { EngineAudio } from '../audio';

// Wheel Component with proper Ref forwarding
const Wheel = forwardRef(({ radius, leftSide, ...props }: any, ref: any) => {
  return (
    <group ref={ref} {...props}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, 0.25, 16]} />
        <meshStandardMaterial color="#111" />
        <mesh position={[0, 0.1, 0]}>
           <boxGeometry args={[radius * 1.5, 0.05, 0.05]} />
           <meshStandardMaterial color="#333" />
        </mesh>
      </mesh>
    </group>
  );
});

interface VehicleProps {
  position: [number, number, number];
  rotation: [number, number, number];
  stats: CarStats;
  def: CarDef;
  color: string;
  onSpeedUpdate: (kph: number, rpm: number, gear: number) => void;
  controls: { forward: boolean, backward: boolean, left: boolean, right: boolean, brake: boolean };
}

export const Vehicle: React.FC<VehicleProps> = ({ position, rotation, stats, def, color, onSpeedUpdate, controls }) => {
  // Chassis physics
  const chassisWidth = 1.8;
  const chassisHeight = 0.6;
  const chassisLength = 4.2;
  const mass = stats.weight;

  const [chassisBody, chassisApi] = useBox(() => ({
    allowSleep: false,
    args: [chassisWidth, chassisHeight, chassisLength],
    mass,
    position,
    rotation,
    angularDamping: 0.5, // Helps stability
    linearDamping: 0.05
  }), useRef<THREE.Mesh>(null));

  // Wheel configuration
  const wheelInfo = {
    radius: 0.35,
    directionLocal: [0, -1, 0] as [number, number, number],
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.3,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    axleLocal: [-1, 0, 0] as [number, number, number],
    chassisConnectionPointLocal: [1, 0, 1] as [number, number, number],
    useCustomSlidingRotationalSpeed: true,
    customSlidingRotationalSpeed: -30,
    frictionSlip: 2.5 * stats.grip,
  };

  const wheel1 = useRef<THREE.Group>(null);
  const wheel2 = useRef<THREE.Group>(null);
  const wheel3 = useRef<THREE.Group>(null);
  const wheel4 = useRef<THREE.Group>(null);
  
  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody,
    wheelInfos: [
      { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [-chassisWidth / 2 + 0.3, -chassisHeight / 2, chassisLength / 2 - 0.5] as [number, number, number] },
      { ...wheelInfo, isFrontWheel: true, chassisConnectionPointLocal: [chassisWidth / 2 - 0.3, -chassisHeight / 2, chassisLength / 2 - 0.5] as [number, number, number] },
      { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [-chassisWidth / 2 + 0.3, -chassisHeight / 2, -chassisLength / 2 + 0.5] as [number, number, number] },
      { ...wheelInfo, isFrontWheel: false, chassisConnectionPointLocal: [chassisWidth / 2 - 0.3, -chassisHeight / 2, -chassisLength / 2 + 0.5] as [number, number, number] },
    ],
    wheels: [wheel1, wheel2, wheel3, wheel4],
  }));

  // Engine State
  const engineRef = useRef({
    rpm: 800,
    gear: 1,
    speed: 0
  });
  
  const audioRef = useRef<EngineAudio | null>(null);
  useEffect(() => {
    // Only init audio on user interaction ideally, but here we try safely
    const initAudio = () => {
        try {
          if (!audioRef.current) {
            audioRef.current = new EngineAudio();
          }
        } catch (e) {
          console.warn("Audio init failed, user interaction may be needed", e);
        }
    }
    
    // Attempt init
    initAudio();

    return () => {
      try {
        if (audioRef.current) audioRef.current.stop();
      } catch (e) {
        // ignore audio cleanup error
      }
    };
  }, []);

  // Camera State
  const defaultCameraOffset = new THREE.Vector3(0, 3, -6.5); // Behind and above
  const currentCameraPos = useRef(new THREE.Vector3(position[0], position[1] + 5, position[2] - 10));

  useFrame((state, delta) => {
    if (!chassisApi || !vehicleApi || !chassisBody.current) return;

    const { forward, backward, left, right, brake } = controls;
    
    // Steering
    const steerValue = left ? 0.35 : right ? -0.35 : 0;
    vehicleApi.setSteeringValue(steerValue, 0);
    vehicleApi.setSteeringValue(steerValue, 1);

    // Drivetrain Simulation
    let engineForce = 0;
    let brakeForce = 0;

    // Significantly increased multiplier for fun arcade feel
    const maxForce = stats.torque * 50; 
    
    if (forward) engineForce = -maxForce;
    if (backward) engineForce = maxForce;
    if (brake) brakeForce = 250;

    // Apply to correct wheels based on drivetrain
    if (def.driveTrain === 'FWD' || def.driveTrain === 'AWD') {
      vehicleApi.applyEngineForce(engineForce, 0);
      vehicleApi.applyEngineForce(engineForce, 1);
    }
    if (def.driveTrain === 'RWD' || def.driveTrain === 'AWD') {
      vehicleApi.applyEngineForce(engineForce, 2);
      vehicleApi.applyEngineForce(engineForce, 3);
    }

    vehicleApi.setBrake(brakeForce, 0);
    vehicleApi.setBrake(brakeForce, 1);
    vehicleApi.setBrake(brakeForce, 2);
    vehicleApi.setBrake(brakeForce, 3);

    // RPM Logic
    const current = engineRef.current;
    if (forward) {
      current.rpm = Math.min(8000, current.rpm + 100 * (4000/current.rpm));
    } else {
      current.rpm = Math.max(800, current.rpm - 150);
    }
    
    // Fake speed calc for HUD based on RPM + Gear (simplified)
    const estimatedSpeed = (current.rpm / 8000) * stats.topSpeed; 
    
    if (audioRef.current) {
      audioRef.current.setRPM(current.rpm);
    }

    onSpeedUpdate(estimatedSpeed, current.rpm, 1); 

    // --- CHASE CAMERA LOGIC ---
    // Get car position and rotation
    const carPos = new THREE.Vector3();
    const carQuat = new THREE.Quaternion();
    chassisBody.current.getWorldPosition(carPos);
    chassisBody.current.getWorldQuaternion(carQuat);

    // Calculate desired camera position relative to car
    // We rotate the offset vector by the car's rotation
    const cameraOffset = defaultCameraOffset.clone().applyQuaternion(carQuat);
    // Position it behind the car
    const targetCameraPos = carPos.clone().add(cameraOffset);
    
    // Add some "look ahead" or smoothing so it's not rigid
    // Lerp current camera pos to target
    currentCameraPos.current.lerp(targetCameraPos, 5 * delta);

    // Update actual camera
    state.camera.position.copy(currentCameraPos.current);
    // Look slightly above the car center
    state.camera.lookAt(carPos.add(new THREE.Vector3(0, 1, 0)));
  });

  return (
    <group ref={vehicle as any} name="vehicle">
      <mesh ref={chassisBody} name="chassis">
        <boxGeometry args={[chassisWidth, chassisHeight, chassisLength]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
        {/* Cockpit / Window */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.6, 0.4, 2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Headlights */}
        <mesh position={[0.6, 0, 2]} rotation={[0,0,0]}>
           <boxGeometry args={[0.3, 0.2, 0.1]} />
           <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.6, 0, 2]} rotation={[0,0,0]}>
           <boxGeometry args={[0.3, 0.2, 0.1]} />
           <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
        </mesh>
        {/* Taillights */}
        <mesh position={[0.6, 0.1, -2.1]}>
           <boxGeometry args={[0.4, 0.2, 0.1]} />
           <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={1} />
        </mesh>
        <mesh position={[-0.6, 0.1, -2.1]}>
           <boxGeometry args={[0.4, 0.2, 0.1]} />
           <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={1} />
        </mesh>
      </mesh>

      <Wheel ref={wheel1} radius={wheelInfo.radius} leftSide />
      <Wheel ref={wheel2} radius={wheelInfo.radius} />
      <Wheel ref={wheel3} radius={wheelInfo.radius} leftSide />
      <Wheel ref={wheel4} radius={wheelInfo.radius} />
    </group>
  );
};