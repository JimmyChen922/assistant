
import { FlightSummary, FlightEvent, SignalStats, MotorStats, GpsStats } from '../types.ts';
import { HEADER_MAPPINGS } from '../constants.ts';

/**
 * Helper to parse a value safely, supporting Hex strings (0x...) which parseFloat misses.
 */
const parseNumeric = (val: any): number | null => {
    if (typeof val === 'number') return isNaN(val) ? null : val;
    if (typeof val === 'string') {
        if (val.trim() === '') return null;
        // Number() supports "0xFF" hex format, whereas parseFloat("0xFF") stops at x (returns 0).
        const num = Number(val);
        return isNaN(num) ? null : num;
    }
    return null;
};

/**
 * Helper to find a value in a row based on multiple possible column keys
 */
const getValue = (row: any, keys: string[] | undefined): number | null => {
    if (!keys || !Array.isArray(keys)) return null;
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
            return parseNumeric(row[key]);
        }
    }
    return null;
};

// Define Failsafe Codes based on user provided documentation
const FAILSAFE_CODE_MAP: Record<number, string> = {
    0: "fs_none (一切正常)",
    1: "fs_armed_dis (禁止解鎖 - 系統自檢失敗)",
    2: "fs_rtpl (精準返航並降落 - 視覺/RTK輔助)",
    3: "fs_rtl (標準返航 - 信號丟失或主動觸發)",
    4: "fs_elz (降落至緊急降落區 - 預設安全點)",
    5: "fs_att (切換至姿態模式 - GPS丟失)",
    6: "fs_land (原地降落 - 電量嚴重不足)",
    7: "fs_emerg_stop (緊急停機 - 重大故障)"
};

// Define Error Codes based on knowledge base
const ERROR_CODE_MAP: Record<number, string> = {
    0: "err_system_ok (系統全部正常)",
    1: "err_commun_rc_receiver (遙控器失控)",
    2: "err_commun_tele_receiver (數傳通訊異常)",
    3: "err_sensor_accelerometer (感測器：加速規錯誤)",
    4: "err_sensor_gyroscope (感測器：陀螺儀錯誤)",
    5: "err_sensor_barometer (感測器：氣壓計錯誤)",
    6: "err_sensor_magnetometer (感測器：磁力計錯誤)",
    7: "err_sensor_gps (感測器：GPS 錯誤)",
    8: "err_dcm_m33 (四元數：m33 錯誤)",
    9: "err_propulsion_esc (推進系統：電變錯誤)",
    10: "err_propulsion_motor (推進系統：馬達錯誤)",
    11: "err_propulsion_propeller (推進系統：旋翼錯誤)",
    12: "err_power_battery_board (電源：電源板錯誤)",
    13: "err_power_battery (電源：電池錯誤)",
    14: "err_flash (Flash 錯誤)",
    15: "err_queue (佇列錯誤)",
    16: "err_processtime (處理時間 (Loop Time) 異常)",
    17: "copter_armed_stage (飛機解鎖狀態異常)",
    18: "bump_prevent_broken (避障感測有問題則停止防撞控制)",
    19: "err_calib_accelerometer (加速規校準錯誤)",
    20: "err_calib_magnetometer (磁力計校準錯誤)",
    21: "err_estimate_ins (慣性導航系統)",
    22: "err_calib_gyro (陀螺儀校準錯誤)",
    23: "rc_mode_switch (RC 模式切換)",
    24: "buzzer_sound (緊報器錯誤)",
    25: "err_commun_beacon (Beacon 或光流異常)",
    26: "err_commun_lrf (LR9074通訊頻率錯誤)",
    27: "err_commun_transbd (Arduino 特殊 heartbeat)",
    28: "err_commun_radar (毫米波雷達)",
    29: "err_estimate_of (光流估測異常)",
    30: "err_geofence (地理围栏錯誤)",
    31: "reserve_31 (-)",
    32: "err_invalid (限制錯誤種類)"
};

// Define Flight Modes based on knowledge base
const FLIGHT_MODE_MAP: Record<number, string> = {
    0: "mode_stabilize (Attitude Mode)",
    1: "mode_acro (Acrobatics)",
    2: "mode_alt_hold (Altitude Hold Mode)",
    3: "mode_auto (Auto Mode)",
    4: "mode_guided (Guided Mode)",
    5: "mode_loiter (Loiter Mode / GPS Mode)",
    6: "mode_rtl (Return To Launch/Home Mode)",
    7: "mode_circle (Circle Mode)",
    9: "mode_land (Land Mode)",
    10: "mode_OF_loiter (Optical Flow Loiter Mode)",
    11: "mode_drift (Drift Mode)",
    13: "mode_sport (Sport Mode)",
    14: "mode_flip (Flip Mode)",
    15: "mode_autotune (Autotune Mode)",
    16: "mode_poshold (Position Hold Mode)",
    17: "mode_avoid (Avoidance Mode)",
    18: "mode_elz (emergencyLandingZone)",
    23: "mode_follow (Follow Me Mode)"
};

/**
 * Helper to auto-detect battery configuration based on initial voltage.
 * Returns estimated cell count and calculated voltage thresholds.
 */
function autoDetectBatteryConfig(initialVoltage: number) {
    let cellCount = 3; // Default fallback

    // Datasheet: MCX-250421
    // Spec: 4S 8.7Ah
    // Nom: 14.8V
    // Max Charge: 17.2V (4.3V/cell)
    // Cut-off: 12.8V (3.2V/cell)
    // Max Continuous: 20A
    // Max Pulse: 40A
    // System Design: 100% = 17V, 0% = 13.6V

    if (initialVoltage > 0) {
        if (initialVoltage > 58) {
            // Likely 14S (58.8V max)
            cellCount = 14;
            return {
                cellCount,
                warningVoltage: cellCount * 3.5,
                minVoltage: cellCount * 3.2,
                maxContinuousCurrent: 120, 
                maxBurstCurrent: 180 
            };
        } else if (initialVoltage > 41) {
            // Likely 12S (50.4V max)
            cellCount = 12;
            return {
                cellCount,
                warningVoltage: cellCount * 3.5,
                minVoltage: cellCount * 3.2,
                maxContinuousCurrent: 120, 
                maxBurstCurrent: 180 
            };
        } else if (initialVoltage > 30) {
            // Likely 10S (42.0V max)
            cellCount = 10;
            return {
                cellCount,
                warningVoltage: cellCount * 3.5,
                minVoltage: cellCount * 3.2,
                maxContinuousCurrent: 100, 
                maxBurstCurrent: 150 
            };
        } else if (initialVoltage > 26) {
            // Likely 8S (33.6V max)
            cellCount = 8;
            return {
                cellCount,
                warningVoltage: cellCount * 3.5,
                minVoltage: cellCount * 3.2,
                maxContinuousCurrent: 80, 
                maxBurstCurrent: 120 
            };
        } else if (initialVoltage > 18) {
            // Likely 6S (25.2V max)
            cellCount = 6;
            return {
                cellCount,
                warningVoltage: cellCount * 3.5,
                minVoltage: cellCount * 3.2,
                maxContinuousCurrent: 60, 
                maxBurstCurrent: 100 
            };
        } else if (initialVoltage > 12.5) {
            // Likely 4S (16.8V - 17.2V max)
            // APPLY SPECIFIC MCX DATASHEET SPECS HERE
            cellCount = 4;
            return {
                cellCount,
                warningVoltage: 13.6,      // System Design 0%
                minVoltage: 12.8,          // Datasheet Cut-off
                maxContinuousCurrent: 20,  // Datasheet
                maxBurstCurrent: 40        // Datasheet
            };
        } else {
            cellCount = 3;
        }
    }

    // Fallback for 3S or unknown
    return {
        cellCount,
        warningVoltage: cellCount * 3.5,
        minVoltage: cellCount * 3.2,
        maxContinuousCurrent: 40, 
        maxBurstCurrent: 60 
    };
}


/**
 * Main function to generate the flight summary for the LLM
 */
export function generateFlightSummary(data: any[]): FlightSummary {
    if (!data || data.length === 0) {
        throw new Error("No data provided for analysis");
    }

    const events: FlightEvent[] = [];
    const errorCodes = new Set<string>();

    // --- 1. Identify Key Columns ---
    const timeKeys = ['time', 'blackbox.wall_time', 'unix_time'];
    const voltageKeys = HEADER_MAPPINGS['blackbox.esc_info.esc[0].voltage'] || []; 
    const currentKeys = HEADER_MAPPINGS['blackbox.esc_info.esc[0].current'] || []; 
    
    const vibrXKeys = HEADER_MAPPINGS['blackbox.vibr_.x'];
    const vibrYKeys = HEADER_MAPPINGS['blackbox.vibr_.y'];
    const vibrZKeys = HEADER_MAPPINGS['blackbox.vibr_.z'];
    
    const rollKeys = HEADER_MAPPINGS['blackbox.attitude.roll'];
    const pitchKeys = HEADER_MAPPINGS['blackbox.attitude.pitch'];
    
    const altKeys = HEADER_MAPPINGS['blackbox.sensor_values.gps_data.altitude'];
    const armedKeys = HEADER_MAPPINGS['blackbox.armed'];
    const errorKeys = HEADER_MAPPINGS['blackbox.error'];
    const fsKeys = HEADER_MAPPINGS['blackbox.fs_act'];
    const flightModeKeys = HEADER_MAPPINGS['blackbox.receiver_panel.flight_mode'];

    // Motor Keys (0-3)
    const motorKeys = [
        HEADER_MAPPINGS['blackbox.motor[0]'],
        HEADER_MAPPINGS['blackbox.motor[1]'],
        HEADER_MAPPINGS['blackbox.motor[2]'],
        HEADER_MAPPINGS['blackbox.motor[3]']
    ];

    // GPS Health Keys
    // Add fallback if key mapping is missing
    const satNumKeys = HEADER_MAPPINGS['blackbox.sensor_values.gps_data.satellite_num'] || ['satellite_num', 'sats', 'numSat'];
    const hdopKeys = HEADER_MAPPINGS['blackbox.sensor_values.gps_data.hori_dop'] || ['hori_dop', 'HDOP'];

    // --- 2. Iterate Data for Events & Stats ---
    let maxAltitude = -Infinity;
    let startVoltage = 0;
    let minVoltage = Infinity;
    let maxCurrent = -Infinity;
    let currentSum = 0;
    let currentCount = 0;
    
    let maxVibrX = 0;
    let maxVibrY = 0;
    let maxVibrZ = 0;
    let sumVibrZ = 0;
    let vibrCount = 0;

    let maxRoll = 0;
    let maxPitch = 0;

    let wasArmed = false;
    let lastErrorMask = 0; // Using bitmask for errors
    let lastFs = 0;
    let lastFlightMode: number | null = null;
    let lastTime = 0;
    
    // Motor Stats
    const SATURATION_THRESHOLD = 18500;
    const motorStatsData = [0, 1, 2, 3].map(id => ({
        id,
        maxVal: 0,
        sumVal: 0,
        count: 0,
        saturatedDuration: 0,
        isSaturated: false
    }));

    // GPS Stats
    let minSats = Infinity;
    let maxHdop = -Infinity;
    let sumSats = 0;
    let sumHdop = 0;
    let gpsCount = 0;
    
    // Battery Stats for event triggering
    let lowVoltageTriggered = false;
    let criticalVoltageTriggered = false;
    let overCurrentTriggered = false;
    
    // Determine Battery Config (Placeholder, will be updated when first voltage is read)
    let batteryConfig = {
        cellCount: 0,
        minVoltage: 0,
        warningVoltage: 0,
        maxContinuousCurrent: 100,
        maxBurstCurrent: 150
    };
    let batteryConfigured = false;

    // Thresholds for event detection
    const HIGH_VIBRATION_THRESHOLD = 60; // m/s^2
    let isHighVibeActive = false;

    // Find start time
    const startRow = data.find(r => r);
    const startTime = getValue(startRow, timeKeys) || 0;
    
    // Get initial voltage
    const firstVolt = getValue(data.find(r => getValue(r, voltageKeys) !== null), voltageKeys);
    startVoltage = firstVolt || 0;

    // Auto-configure battery specs based on start voltage
    if (startVoltage > 0) {
        batteryConfig = autoDetectBatteryConfig(startVoltage);
        batteryConfigured = true;
    }

    data.forEach((row, i) => {
        const currentTimeVal = (getValue(row, timeKeys) || 0) - startTime;
        const dt = (i === 0) ? 0 : Math.max(0, currentTimeVal - lastTime);
        lastTime = currentTimeVal;
        
        // Altitude
        const alt = getValue(row, altKeys);
        if (alt !== null && alt > maxAltitude) maxAltitude = alt;

        // Battery
        const volt = getValue(row, voltageKeys);
        if (volt !== null) {
             // Late configuration if start voltage was missing
             if (!batteryConfigured && volt > 5) {
                 batteryConfig = autoDetectBatteryConfig(volt);
                 batteryConfigured = true;
             }

             if (volt < minVoltage && volt > 0) minVoltage = volt;
        }
        
        const curr = getValue(row, currentKeys);
        if (curr !== null) {
            if (curr > maxCurrent) maxCurrent = curr;
            currentSum += curr;
            currentCount++;
        }
        
        // Battery Analysis Events
        if (batteryConfigured && volt !== null && volt > 5) { 
            if (volt < batteryConfig.minVoltage && !criticalVoltageTriggered) {
                events.push({
                    timestamp: currentTimeVal,
                    type: 'BATTERY_WARNING',
                    description: `Critical Battery Voltage (< ${batteryConfig.minVoltage.toFixed(1)}V, ${batteryConfig.cellCount}S)`,
                    value: volt
                });
                criticalVoltageTriggered = true;
            } else if (volt < batteryConfig.warningVoltage && !lowVoltageTriggered) {
                events.push({
                    timestamp: currentTimeVal,
                    type: 'BATTERY_WARNING',
                    description: `Low Battery Voltage (< ${batteryConfig.warningVoltage.toFixed(1)}V - System 0%)`,
                    value: volt
                });
                lowVoltageTriggered = true;
            }
        }

        if (batteryConfigured && curr !== null) {
            if (curr > batteryConfig.maxContinuousCurrent && !overCurrentTriggered) {
                 events.push({
                    timestamp: currentTimeVal,
                    type: 'BATTERY_WARNING',
                    description: `Battery Overcurrent Detected (> ${batteryConfig.maxContinuousCurrent}A)`,
                    value: curr
                });
                overCurrentTriggered = true;
            }
        }

        // Attitude
        let roll = Math.abs(getValue(row, rollKeys) || 0);
        let pitch = Math.abs(getValue(row, pitchKeys) || 0);
        
        if (roll < 7) roll *= 57.3;
        if (pitch < 7) pitch *= 57.3;

        if (roll > maxRoll) maxRoll = roll;
        if (pitch > maxPitch) maxPitch = pitch;

        // Vibration
        const vx = Math.abs(getValue(row, vibrXKeys) || 0);
        const vy = Math.abs(getValue(row, vibrYKeys) || 0);
        const vz = Math.abs(getValue(row, vibrZKeys) || 0);
        
        if (vx > maxVibrX) maxVibrX = vx;
        if (vy > maxVibrY) maxVibrY = vy;
        if (vz > maxVibrZ) maxVibrZ = vz;
        sumVibrZ += vz;
        vibrCount++;
        
        if (vz > HIGH_VIBRATION_THRESHOLD && !isHighVibeActive) {
            events.push({
                timestamp: currentTimeVal,
                type: 'HIGH_VIBRATION',
                description: `High Z-Axis Vibration Detected (${vz.toFixed(1)} m/s²)`,
                value: vz
            });
            isHighVibeActive = true;
        } else if (vz < HIGH_VIBRATION_THRESHOLD && isHighVibeActive) {
            isHighVibeActive = false;
        }

        // --- New Features (Motor & GPS) ---

        // Motor Saturation
        motorKeys.forEach((keys, idx) => {
            const mVal = getValue(row, keys);
            if (mVal !== null) {
                const stat = motorStatsData[idx];
                stat.count++;
                stat.sumVal += mVal;
                if (mVal > stat.maxVal) stat.maxVal = mVal;
                
                if (mVal > SATURATION_THRESHOLD) {
                    stat.saturatedDuration += dt;
                    if (!stat.isSaturated && stat.saturatedDuration > 1.0) { // Log event if saturated > 1s
                        events.push({
                            timestamp: currentTimeVal,
                            type: 'MOTOR_SATURATION',
                            description: `Motor ${idx+1} Saturated (> ${SATURATION_THRESHOLD})`,
                            value: mVal
                        });
                        stat.isSaturated = true;
                    }
                } else {
                    stat.isSaturated = false;
                }
            }
        });

        // GPS Health
        const sats = getValue(row, satNumKeys);
        const hdop = getValue(row, hdopKeys);
        if (sats !== null) {
            if (sats < minSats) minSats = sats;
            sumSats += sats;
        }
        if (hdop !== null) {
            if (hdop > maxHdop) maxHdop = hdop;
            sumHdop += hdop;
        }
        if (sats !== null || hdop !== null) gpsCount++;


        // --- Event Detection ---

        // Flight Mode
        const flightModeVal = getValue(row, flightModeKeys);
        if (flightModeVal !== null && flightModeVal !== lastFlightMode) {
             const desc = FLIGHT_MODE_MAP[flightModeVal] || `Unknown Mode ${flightModeVal}`;
             events.push({
                timestamp: currentTimeVal,
                type: 'MODE_CHANGE',
                description: `飛行模式切換: ${desc}`,
                value: flightModeVal
            });
            lastFlightMode = flightModeVal;
        }

        // Armed State
        const armedVal = getValue(row, armedKeys);
        const isArmed = armedVal !== null && armedVal > 0;
        if (isArmed !== wasArmed) {
            events.push({
                timestamp: currentTimeVal,
                type: isArmed ? 'ARMING' : 'DISARMING',
                description: isArmed ? 'Vehicle Armed (解鎖)' : 'Vehicle Disarmed (上鎖)',
                value: armedVal || 0
            });
            wasArmed = isArmed;
        }

        // Error Codes (Bitwise)
        const currentErrorMask = getValue(row, errorKeys) || 0;
        if (currentErrorMask !== lastErrorMask) {
             // Calculate diff
             const diff = currentErrorMask ^ lastErrorMask;
             
             // Check each bit (0-31)
             for (let bit = 0; bit < 32; bit++) {
                 if ((diff >>> bit) & 1) {
                     const isRaised = (currentErrorMask >>> bit) & 1;
                     // Map Bit 0 -> Key 1, Bit 1 -> Key 2, etc.
                     const errorId = bit + 1;
                     const desc = ERROR_CODE_MAP[errorId] || `Unknown Error (Bit ${bit})`;
                     
                     if (isRaised) {
                         events.push({
                            timestamp: currentTimeVal,
                            type: 'ERROR',
                            description: `錯誤觸發: ${desc}`,
                            value: errorId
                        });
                        errorCodes.add(`${errorId}: ${desc}`);
                     } else {
                         events.push({
                            timestamp: currentTimeVal,
                            type: 'ERROR',
                            description: `錯誤解除: ${desc}`,
                            value: errorId
                        });
                     }
                 }
             }

             // Check if system became completely healthy
             if (currentErrorMask === 0 && lastErrorMask !== 0) {
                 events.push({
                    timestamp: currentTimeVal,
                    type: 'ERROR',
                    description: `系統回復正常 (System OK)`,
                    value: 0
                });
             }
             
            lastErrorMask = currentErrorMask;
        }

        // Failsafe
        const fsVal = getValue(row, fsKeys);
        if (fsVal !== null && fsVal !== lastFs) {
             if (fsVal !== 0) {
                 const desc = FAILSAFE_CODE_MAP[fsVal] || `Unknown Failsafe ${fsVal}`;
                 events.push({
                    timestamp: currentTimeVal,
                    type: 'FAILSAFE',
                    description: `失控保護觸發: ${desc}`,
                    value: fsVal
                });
             } else {
                 events.push({
                    timestamp: currentTimeVal,
                    type: 'FAILSAFE',
                    description: `失控保護解除 (fs_none)`,
                    value: fsVal
                });
             }
            lastFs = fsVal;
        }
    });

    const endVoltage = getValue(data[data.length - 1], voltageKeys) || 0;
    const avgCurrent = currentCount > 0 ? currentSum / currentCount : 0;
    const avgVibrZ = vibrCount > 0 ? sumVibrZ / vibrCount : 0;

    const takeoffEvent = events.find(e => e.type === 'ARMING');
    const landingEvent = events.filter(e => e.type === 'DISARMING').pop();
    const crashEvent = events.filter(e => (e.type === 'ERROR' && e.value !== 0) || (e.type === 'FAILSAFE' && e.value !== 0)).pop();
    const crashTime = (crashEvent && (!landingEvent || crashEvent.timestamp > landingEvent.timestamp)) ? crashEvent.timestamp : undefined;
    
    // Add battery detection event for context
    if (batteryConfigured) {
        // Insert at the beginning
        events.unshift({
            timestamp: 0,
            type: 'BATTERY_WARNING',
            description: `Battery Detected: ${batteryConfig.cellCount}S (Start: ${startVoltage.toFixed(1)}V, Warn: ${batteryConfig.warningVoltage}V, Crit: ${batteryConfig.minVoltage}V)`,
            value: batteryConfig.cellCount
        });
    }

    return {
        durationSeconds: (getValue(data[data.length-1], timeKeys) || 0) - startTime,
        maxAltitude: maxAltitude === -Infinity ? 0 : maxAltitude,
        maxDistance: 0, 
        battery: {
            startVoltage,
            endVoltage,
            minVoltage: minVoltage === Infinity ? 0 : minVoltage,
            maxCurrent: maxCurrent === -Infinity ? 0 : maxCurrent,
            avgCurrent
        },
        vibration: {
            maxX: maxVibrX,
            maxY: maxVibrY,
            maxZ: maxVibrZ,
            avgZ: avgVibrZ
        },
        attitude: {
            maxRoll: maxRoll,
            maxPitch: maxPitch
        },
        motorStats: motorStatsData.map(m => ({
            id: m.id + 1, // 1-based index for display
            maxVal: m.maxVal,
            saturatedDuration: m.saturatedDuration,
            avgVal: m.count > 0 ? m.sumVal / m.count : 0
        })),
        gpsStats: {
            minSatellites: minSats === Infinity ? 0 : minSats,
            maxHDOP: maxHdop === -Infinity ? 0 : maxHdop,
            avgSatellites: gpsCount > 0 ? sumSats / gpsCount : 0,
            avgHDOP: gpsCount > 0 ? sumHdop / gpsCount : 0
        },
        events: events,
        errorCodes: Array.from(errorCodes),
        flightPhases: {
            takeoffTime: takeoffEvent?.timestamp,
            landingTime: landingEvent?.timestamp,
            crashTime: crashTime
        }
    };
}
