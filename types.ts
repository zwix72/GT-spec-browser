export interface CarStats {
  horsepower: number;
  torque: number; // Nm
  weight: number; // kg
  grip: number; // multiplier
  topSpeed: number; // km/h (est)
  acceleration: number; // 0-100 est
}

export interface CarDef {
  id: string;
  name: string;
  price: number;
  baseStats: CarStats;
  driveTrain: 'RWD' | 'FWD' | 'AWD';
  color: string;
  meshType: 'sport' | 'muscle' | 'super';
}

export interface Upgrade {
  id: string;
  name: string;
  type: 'engine' | 'weight' | 'tires' | 'turbo';
  tier: number; // 1, 2, 3
  cost: number;
  modifiers: Partial<CarStats>;
}

export interface OwnedCar {
  instanceId: string;
  defId: string;
  upgrades: string[]; // Upgrade IDs
  customColor: string;
}

export interface GameState {
  credits: number;
  ownedCars: OwnedCar[];
  activeCarId: string;
  unlockedTracks: string[];
}
