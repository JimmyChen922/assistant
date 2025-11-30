

export interface DataPoint {
    x: number;
    y: number;
}

export type LogData = Record<string, DataPoint[]>;

export interface FlightInfo {
    takeoffTime: string;
    totalDuration: string;
    takeoffTimestampMs: number;
    isRelativeTime: boolean;
}

export interface FlightPathPoint {
    lng: number;
    lat: number;
    alt: number;
    time: number;
}

export type ChartGroup = 'power' | 'flight_control' | 'impact' | 'control_input';

export interface ActionLog {
    time: Date;
    message: string;
}

export interface ChartDefinition {
    id: string;
    title: string;
    yLabel: string;
    yLabelRight?: string;
    isStepped?: boolean;
    datasets: {
        key: string;
        label: string;
        yAxisId?: 'left' | 'right';
    }[];
}

export interface AttitudeData {
    roll: DataPoint[];
    pitch: DataPoint[];
    yaw: DataPoint[];
}

// --- Agentic / Feature Extraction Types ---

export interface SignalStats {
    min: number;
    max: number;
    avg: number;
    minAt?: number; // timestamp (relative seconds)
    maxAt?: number; // timestamp (relative seconds)
}

export interface FlightEvent {
    timestamp: number; // relative seconds
    type: 'ERROR' | 'FAILSAFE' | 'ARMING' | 'DISARMING' | 'MODE_CHANGE' | 'IMPACT_DETECTED' | 'HIGH_VIBRATION' | 'MOTOR_SATURATION' | 'BATTERY_WARNING';
    description: string;
    value?: number | string;
}

export interface MotorStats {
    id: number;
    maxVal: number;
    saturatedDuration: number; // seconds where throttle > threshold
    avgVal: number;
}

export interface GpsStats {
    minSatellites: number;
    maxHDOP: number;
    avgSatellites: number;
    avgHDOP: number;
}

export interface FlightSummary {
    durationSeconds: number;
    maxAltitude: number;
    maxDistance: number;
    battery: {
        startVoltage: number;
        endVoltage: number;
        minVoltage: number;
        maxCurrent: number;
        avgCurrent: number;
    };
    vibration: {
        maxX: number;
        maxY: number;
        maxZ: number;
        avgZ: number;
    };
    attitude: {
        maxRoll: number;
        maxPitch: number;
    };
    motorStats: MotorStats[];
    gpsStats: GpsStats;
    events: FlightEvent[];
    errorCodes: string[];
    flightPhases: {
        takeoffTime?: number;
        landingTime?: number;
        crashTime?: number;
    };
}