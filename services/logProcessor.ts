
import { LogData, FlightInfo, DataPoint, FlightPathPoint } from '../types.ts';
import { HEADER_MAPPINGS, ALL_DATA_KEYS, DATA_KEY_METADATA } from '../constants.ts';

const getLogValue = (row: any, canonicalKey: string): number | null => {
    const possibleKeys = HEADER_MAPPINGS[canonicalKey] || [canonicalKey];
    for (const key of possibleKeys) {
        const value = row[key];
        if (value !== undefined && value !== null) {
            const numValue = parseFloat(value);
            // Return the value if it's a valid number
            if (!isNaN(numValue)) {
                return numValue;
            }
        }
    }
    return null;
};

// New helper function to find a numeric value from a list of possible keys.
// This makes GPS data extraction more robust against different CSV header names.
const findValueFromKeys = (row: any, keys: string[]): number | null => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
            const value = parseFloat(row[key]);
            if (!isNaN(value)) {
                return value;
            }
        }
    }
    return null;
};

// New helper to find a valid column key from a prioritized list.
const findKey = (firstRow: any, keys: string[]): string | null => {
    if (!firstRow) return null;
    for (const key of keys) {
        if (firstRow[key] !== undefined && firstRow[key] !== null) {
            return key;
        }
    }
    return null;
};

export function processMetadata(data: any[]): FlightInfo {
    const firstValidRow = data.find(r => r);

    // 1. Calculate duration from any available time column.
    const allTimeKeys = [
        'unix_time', 'blackbox.sensor_values.gps_data.unix_time',
        'time', 'blackbox.steady_time', 'blackbox.wall_time'
    ];
    const durationTimeKey = findKey(firstValidRow, allTimeKeys);
    
    let minTime = Infinity, maxTime = -Infinity;
    if (durationTimeKey) {
        const isAbsolute = durationTimeKey.includes('unix_time');
        data.forEach(row => {
            const val = row[durationTimeKey];
            if (row && typeof val === 'number' && isFinite(val)) {
                // For absolute time, ignore initial zero or invalid values
                if (isAbsolute && val <= 0) return;
                minTime = Math.min(minTime, val);
                maxTime = Math.max(maxTime, val);
            }
        });
    }

    let totalDuration = 'N/A';
    if (isFinite(minTime)) {
        const isAbsolute = durationTimeKey!.includes('unix_time');
        let durationMs: number;
        if (isAbsolute) {
            const isSeconds = minTime < 1e12; // Heuristic to check if timestamp is in seconds
            const minMs = isSeconds ? minTime * 1000 : minTime;
            const maxMs = isSeconds ? maxTime * 1000 : maxTime;
            durationMs = maxMs - minMs;
        } else {
            // Relative time in us or ms
            const timeScale = minTime > 1e6 ? 0.001 : 1; // to ms
            durationMs = (maxTime - minTime) * timeScale;
        }
        
        if (durationMs > 0) {
            const totalSeconds = Math.floor(durationMs / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            totalDuration = `${minutes} min ${seconds} sec`;
        }
    }

    // 2. Check for an absolute takeoff time from multiple possible headers.
    const unixTimeKeys = ['unix_time', 'blackbox.sensor_values.gps_data.unix_time'];
    let takeoffTimestamp: number | null = null;
    
    for (const row of data) {
        if (row) {
            const ts = findValueFromKeys(row, unixTimeKeys);
            if (ts !== null && isFinite(ts) && ts > 0) {
                takeoffTimestamp = ts;
                break; // Found the first valid timestamp
            }
        }
    }
    
    if (takeoffTimestamp !== null) {
        const takeoffTimestampMs = takeoffTimestamp < 1e12 ? takeoffTimestamp * 1000 : takeoffTimestamp; // handle seconds vs milliseconds
        const flightDate = new Date(takeoffTimestampMs);
        const taipeiTime = new Intl.DateTimeFormat('zh-TW', {
            dateStyle: 'long', timeStyle: 'medium', timeZone: 'Asia/Taipei', hourCycle: 'h23'
        }).format(flightDate);
        
        return { 
            takeoffTime: taipeiTime, 
            totalDuration,
            takeoffTimestampMs, 
            isRelativeTime: false 
        };
    }
    
    // 3. If no absolute timestamp is found, it's a relative timeline.
    if (!isFinite(minTime)) { // No time data at all
        return { takeoffTime: 'N/A', totalDuration: 'N/A', takeoffTimestampMs: 0, isRelativeTime: true };
    }

    return {
        takeoffTime: 'N/A (無絕對時間戳)',
        totalDuration, // Use duration calculated from 'time' column
        takeoffTimestampMs: 0,
        isRelativeTime: true
    };
}


export function processRawData(data: any[]): { chartData: LogData, flightPath: FlightPathPoint[] } {
    const step = 1;
    
    const firstValidRow = data.find(r => r);
    
    const timeKeys = [
        'unix_time', 
        'blackbox.sensor_values.gps_data.unix_time',
        'time', 
        'blackbox.steady_time', 
        'blackbox.wall_time'
    ];
    const timeKey = findKey(firstValidRow, timeKeys);

    if (!timeKey) {
        console.error("No suitable time column found for chart processing. Looked for:", timeKeys.join(', '));
        return { chartData: {}, flightPath: [] };
    }
    
    const isAbsoluteTime = timeKey.includes('unix_time');

    let minTime = Infinity;
    for (const row of data) {
        const val = row[timeKey];
        if (row && typeof val === 'number' && isFinite(val)) {
            // For absolute time, ignore initial zero values which can happen before GPS lock
            if (isAbsoluteTime && val <= 0) continue;
            minTime = Math.min(minTime, val);
        }
    }

    const startTime = isFinite(minTime) ? minTime : 0;
    
    const getRelativeTimeInSeconds = (rowValue: number): number => {
        if (isAbsoluteTime) {
            // Handle unix timestamps (seconds vs milliseconds)
            const isSeconds = startTime < 1e12;
            const currentMs = isSeconds ? rowValue * 1000 : rowValue;
            const startMs = isSeconds ? startTime * 1000 : startTime;
            return (currentMs - startMs) / 1000;
        } else {
            // Handle relative timestamps (microseconds vs milliseconds)
            const timeScale = startTime > 1e6 ? 0.001 : 1; // us -> ms or ms -> ms
            return ((rowValue - startTime) * timeScale) / 1000; // ms -> s
        }
    };
    
    let initialAltitude: number | null = null;
    // Pre-scan to find the first valid altitude to use as a baseline for relative altitude calculations
    for (const row of data) {
        if (row) {
            const alt = getLogValue(row, 'blackbox.sensor_values.gps_data.altitude');
            if (alt !== null) {
                initialAltitude = alt;
                break;
            }
        }
    }

    // Exclude special keys that are not direct chart data series from being initialized here
    const relevantKeys = ALL_DATA_KEYS.filter(k => !['time', 'unix_time', 'blackbox.sensor_values.gps_data.longitude', 'blackbox.sensor_values.gps_data.latitude'].includes(k));
    const chartData: Record<string, DataPoint[]> = {};
    relevantKeys.forEach(key => chartData[key] = []);
    chartData['magnet_total'] = []; // Explicitly initialize calculated field

    const flightPath: FlightPathPoint[] = [];

    let lastTimeVal: number | undefined = undefined;
    let subSecondCounter = 0;

    for (let i = 0; i < data.length; i += step) {
        const row = data[i];
        const timeVal = row ? row[timeKey] : undefined;
        if (!row || typeof timeVal !== 'number' || !isFinite(timeVal)) continue;
        if (isAbsoluteTime && timeVal <= 0) continue;
        
        // If the base timestamp from the file hasn't changed, it means we have multiple
        // data points for the same low-precision timestamp (e.g., 5 entries for the same second).
        // We reset the counter whenever the timestamp changes.
        if (timeVal !== lastTimeVal) {
            subSecondCounter = 0;
            lastTimeVal = timeVal;
        }

        // Base time in seconds from the log file
        const t_base = getRelativeTimeInSeconds(timeVal);

        // To handle high-frequency data (like 5Hz) logged with low-precision timestamps,
        // we add a synthetic offset to space out the data points within that second.
        // Based on the common 5Hz log rate, we assume a 200ms (0.2s) interval between points
        // that share the same base timestamp.
        // This ensures each point has a unique and visually distinct time value on the chart.
        const t = t_base + (subSecondCounter * 0.2);
        
        subSecondCounter++; // Increment for the next row, in case it shares the same timestamp.
        
        let magX: number | null = null;
        let magY: number | null = null;
        let magZ: number | null = null;

        for (const key of relevantKeys) {
            let value = getLogValue(row, key);
            if (value !== null) {
                // Apply transformations using the metadata dictionary
                const metadata = DATA_KEY_METADATA[key];
                if (metadata) {
                    if (metadata.isStateful && metadata.statefulTransform) {
                         // Only apply stateful transform if the required state (initialAltitude) is available
                        if (key === 'blackbox.sensor_values.gps_data.altitude' && initialAltitude !== null) {
                            value = metadata.statefulTransform(value, { initialAltitude });
                        }
                    } else if (metadata.transform) {
                        value = metadata.transform(value);
                    }
                }
                chartData[key].push({ x: t, y: value });

                // Capture magnetometer values for calculation
                if (key === 'blackbox.sensor_values.magnet_x') magX = value;
                if (key === 'blackbox.sensor_values.magnet_y') magY = value;
                if (key === 'blackbox.sensor_values.magnet_z') magZ = value;
            }
        }
        
        // Calculate and store total magnetic field strength (squared sum)
        if (magX !== null && magY !== null && magZ !== null) {
            const total = (magX * magX) + (magY * magY) + (magZ * magZ);
            chartData['magnet_total'].push({ x: t, y: total });
        }

        // Flight path data uses absolute altitude for correct 2D/3D map representation
        let lat = getLogValue(row, 'blackbox.sensor_values.gps_data.latitude');
        let lng = getLogValue(row, 'blackbox.sensor_values.gps_data.longitude');
        const alt = getLogValue(row, 'blackbox.sensor_values.gps_data.altitude');


        if (lat !== null && lng !== null && alt !== null && lat !== 0 && lng !== 0) {
            // Check if latitude/longitude values are likely scaled by a large factor (e.g., from some flight controllers)
            // Valid latitude is between -90 and 90. Valid longitude is between -180 and 180.
            if (Math.abs(lat) > 90) {
                lat /= 10000000;
            }
            if (Math.abs(lng) > 180) {
                lng /= 10000000;
            }

            // We need to store time in the same format as the chart's x-axis (syncTime)
            // which is milliseconds, either relative or absolute.
            let pathTime;
            if (isAbsoluteTime) {
                const isSeconds = startTime < 1e12;
                const startMs = isSeconds ? startTime * 1000 : startTime;
                pathTime = startMs + t * 1000; // t is relative seconds
            } else {
                pathTime = t * 1000; // t is relative seconds
            }

            flightPath.push({ lat, lng, alt, time: pathTime });
        }
    }
    
    return { chartData, flightPath };
}
