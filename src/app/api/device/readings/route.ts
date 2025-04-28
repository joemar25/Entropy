// import { NextResponse } from 'next/server';
// import path from 'path';
// import fs from 'fs/promises';
// import { existsSync } from 'fs';
// import { watch } from 'fs';
// import type { NextRequest } from 'next/server';
// import type { DeviceData } from '@/types/device';
// import { debounce } from 'lodash';

// interface Reading {
//     'CO (ppm)': number;
//     'CO2 (ppm)': number;
//     'O3 (ppm)': number;
//     'SO2 (ppm)': number;
//     'NO2 (ppm)': number;
//     'VOCs (ppm)': number;
//     'PM2.5 (ug/m3)': number;
//     timestamp: string;
// }

// const USE_DUMMY_REALTIME = process.env.NEXT_PUBLIC_USE_DUMMY_REALTIME;
// const USE_DUMMY_JSON = process.env.NEXT_PUBLIC_USE_DUMMY_JSON;
// const USE_REALTIME = process.env.NEXT_PUBLIC_USE_REALTIME;

// let jsonReadings: Reading[] = [];
// let dummyReadings: Reading[] = [];
// let lastModified: number | null = null;
// const syntheticDataCache: Map<string, DeviceData> = new Map();

// function generateDummyReading(timestamp: string): Reading {
//     return {
//         'CO (ppm)': Math.random() * 0.5,
//         'CO2 (ppm)': 400 + Math.random() * 50,
//         'O3 (ppm)': Math.random() * 0.1,
//         'SO2 (ppm)': Math.random() * 0.1,
//         'NO2 (ppm)': Math.random() * 0.1,
//         'VOCs (ppm)': Math.random() * 0.2,
//         'PM2.5 (ug/m3)': 0.1 + Math.random() * 5,
//         timestamp,
//     };
// }

// async function writeDummyReadingsToFile() {
//     if (USE_DUMMY_REALTIME) {
//         const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
//         try {
//             await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
//         } catch (error) {
//             console.error('Error writing to realtime.json:', error);
//         }
//     }
// }

// async function updateDummyReadings() {
//     if (USE_DUMMY_REALTIME) {
//         const now = new Date().toISOString();
//         const newReading = generateDummyReading(now);
//         dummyReadings.push(newReading);
//         if (dummyReadings.length > 100) {
//             dummyReadings.shift();
//         }
//         await writeDummyReadingsToFile();
//     }
// }

// async function getJsonReadings(): Promise<Reading[]> {
//     try {
//         const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');

//         if (!existsSync(filePath)) {
//             jsonReadings = [];
//             await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
//             return jsonReadings;
//         }

//         const stats = await fs.stat(filePath);
//         const modified = stats.mtimeMs;

//         if (jsonReadings.length === 0 || lastModified === null || modified > lastModified) {
//             const fileContent = await fs.readFile(filePath, 'utf-8');
//             try {
//                 jsonReadings = JSON.parse(fileContent) as Reading[];
//                 lastModified = modified;
//                 syntheticDataCache.clear(); // Clear cache on file change
//             } catch (parseError) {
//                 console.error('Error parsing readings.json:', parseError);
//                 jsonReadings = [];
//                 await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
//             }
//         }

//         return jsonReadings;
//     } catch (error) {
//         console.error('Error reading readings.json:', error);
//         jsonReadings = [];
//         return jsonReadings;
//     }
// }

// async function getDummyRealtimeReadings(): Promise<Reading[]> {
//     const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
//     try {
//         if (!existsSync(filePath)) {
//             dummyReadings = [];
//             await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
//             return dummyReadings;
//         }

//         const fileContent = await fs.readFile(filePath, 'utf-8');
//         dummyReadings = JSON.parse(fileContent) as Reading[];
//         return dummyReadings;
//     } catch (error) {
//         console.error('Error reading realtime.json:', error);
//         dummyReadings = [];
//         return dummyReadings;
//     }
// }

// function watchReadingsFile() {
//     const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');
//     if (existsSync(filePath)) {
//         const debouncedGetJsonReadings = debounce(getJsonReadings, 500);
//         watch(filePath, async (event) => {
//             if (event === 'change') {
//                 await debouncedGetJsonReadings();
//             }
//         });
//     }
// }

// if (USE_DUMMY_REALTIME) {
//     getDummyRealtimeReadings();
//     setInterval(updateDummyReadings, 5000);
// }
// watchReadingsFile();

// async function getAllReadings(): Promise<Reading[]> {
//     if (USE_DUMMY_REALTIME) {
//         if (!dummyReadings.length) {
//             await getDummyRealtimeReadings();
//             if (!dummyReadings.length) {
//                 dummyReadings.push(generateDummyReading(new Date().toISOString()));
//                 await writeDummyReadingsToFile();
//             }
//         }
//         return dummyReadings;
//     }

//     if (USE_DUMMY_JSON || USE_REALTIME) {
//         const readings = await getJsonReadings();
//         if (!readings.length) {
//             return [generateDummyReading(new Date().toISOString())];
//         }
//         return readings;
//     }

//     return getJsonReadings();
// }

// function convertReadingsToDeviceData(readings: Reading[]): DeviceData {
//     const cacheKey = readings.map(r => r.timestamp).join('|');
//     if (syntheticDataCache.has(cacheKey)) {
//         return syntheticDataCache.get(cacheKey)!;
//     }

//     const deviceData: DeviceData = {
//         temperature: [],
//         humidity: [],
//         pm25: [],
//         voc: [],
//         o3: [],
//         co: [],
//         co2: [],
//         no2: [],
//         so2: [],
//         timestamp: [],
//     };

//     readings.forEach((reading, index) => {
//         const temperature = 22 + Math.sin(index / 5) * 2 + Math.random() * 0.5;
//         const humidity = 45 + Math.cos(index / 4) * 10 + Math.random() * 2;

//         deviceData.temperature.push(Number(temperature.toFixed(2)));
//         deviceData.humidity.push(Number(humidity.toFixed(2)));
//         deviceData.pm25.push(reading['PM2.5 (ug/m3)']);
//         deviceData.voc.push(reading['VOCs (ppm)']);
//         deviceData.o3.push(reading['O3 (ppm)']);
//         deviceData.co.push(reading['CO (ppm)']);
//         deviceData.co2.push(reading['CO2 (ppm)']);
//         deviceData.no2.push(reading['NO2 (ppm)']);
//         deviceData.so2.push(reading['SO2 (ppm)']);
//         deviceData.timestamp.push(reading.timestamp);
//     });

//     syntheticDataCache.set(cacheKey, deviceData);
//     return deviceData;
// }

// export async function GET(request: NextRequest) {
//     try {
//         const url = new URL(request.url);
//         const deviceCode = url.searchParams.get('deviceCode');
//         const timeFilter = url.searchParams.get('timeFilter') || 'all';

//         if (!deviceCode) {
//             return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
//         }

//         const allReadings = await getAllReadings();

//         if (!allReadings.length) {
//             return NextResponse.json({ error: 'No readings available' }, { status: 404 });
//         }

//         const sortedReadings = allReadings.sort(
//             (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//         );

//         let filteredReadings = sortedReadings;
//         const now = new Date();

//         switch (timeFilter) {
//             case '1h':
//                 filteredReadings = sortedReadings.filter(
//                     (r) => now.getTime() - new Date(r.timestamp).getTime() <= 3600 * 1000
//                 );
//                 break;
//             case '6h':
//                 filteredReadings = sortedReadings.filter(
//                     (r) => now.getTime() - new Date(r.timestamp).getTime() <= 6 * 3600 * 1000
//                 );
//                 break;
//             case '24h':
//                 filteredReadings = sortedReadings.filter(
//                     (r) => now.getTime() - new Date(r.timestamp).getTime() <= 24 * 3600 * 1000
//                 );
//                 break;
//             case '10':
//                 filteredReadings = sortedReadings.slice(-10);
//                 break;
//             case '30':
//                 filteredReadings = sortedReadings.slice(-30);
//                 break;
//             case 'all':
//             default:
//                 break;
//         }

//         if (!filteredReadings.length) {
//             filteredReadings = [sortedReadings[sortedReadings.length - 1]];
//         }

//         const deviceData = convertReadingsToDeviceData(filteredReadings);

//         return new NextResponse(JSON.stringify(deviceData), {
//             status: 200,
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Cache-Control': 'no-store, must-revalidate',
//                 'Pragma': 'no-cache',
//             },
//         });
//     } catch (error) {
//         console.error('Error handling reading data:', error);
//         return NextResponse.json(
//             { error: error instanceof Error ? error.message : 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { watch } from 'fs';
import type { NextRequest } from 'next/server';
import { debounce } from 'lodash';
import { thresholds } from '@/utils/device';
import type { DeviceData } from '@/types/device';

// Toggle configuration for parameters
const parameterToggles = {
    temperature: true,
    humidity: true,
    co2: true,
    pm25: true,
    co: false,
    o3: false,
    no2: false,
    so2: false,
    voc: false,
};

interface Reading {
    'Temperature (°C)'?: number;
    'Humidity (%)'?: number;
    'CO2 (ppm)'?: number;
    'PM2.5 (ug/m3)'?: number;
    timestamp: string;
}

const USE_DUMMY_REALTIME = process.env.NEXT_PUBLIC_USE_DUMMY_REALTIME;
const USE_DUMMY_JSON = process.env.NEXT_PUBLIC_USE_DUMMY_JSON;
const USE_REALTIME = process.env.NEXT_PUBLIC_USE_REALTIME;

let jsonReadings: Reading[] = [];
let dummyReadings: Reading[] = [];
let lastModified: number | null = null;
const syntheticDataCache: Map<string, DeviceData> = new Map();

function generateDummyReading(timestamp: string): Reading {
    const reading: Reading = { timestamp };

    if (parameterToggles.temperature) {
        // Temperature: 22–28°C
        reading['Temperature (°C)'] = Number(
            (thresholds.temperature.low + Math.random() * (thresholds.temperature.high - thresholds.temperature.low)).toFixed(2)
        );
    }

    if (parameterToggles.humidity) {
        // Humidity: 40–60%
        reading['Humidity (%)'] = Number(
            (thresholds.humidity.low + Math.random() * (thresholds.humidity.high - thresholds.humidity.low)).toFixed(2)
        );
    }

    if (parameterToggles.co2) {
        // CO2: 400–500 ppm (realistic indoor range within 0–500 threshold)
        reading['CO2 (ppm)'] = Number(
            (400 + Math.random() * 100).toFixed(2)
        );
    }

    if (parameterToggles.pm25) {
        // PM2.5: 0–4 µg/m³
        reading['PM2.5 (ug/m3)'] = Number(
            (thresholds.pm25.low + Math.random() * thresholds.pm25.high).toFixed(2)
        );
    }

    return reading;
}

async function writeDummyReadingsToFile() {
    if (USE_DUMMY_REALTIME) {
        const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
        try {
            await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error writing to realtime.json:', error);
        }
    }
}

async function updateDummyReadings() {
    if (USE_DUMMY_REALTIME) {
        const now = new Date().toISOString();
        const newReading = generateDummyReading(now);
        dummyReadings.push(newReading);
        if (dummyReadings.length > 100) {
            dummyReadings.shift();
        }
        await writeDummyReadingsToFile();
    }
}

async function getJsonReadings(): Promise<Reading[]> {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');

        if (!existsSync(filePath)) {
            jsonReadings = [];
            await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
            return jsonReadings;
        }

        const stats = await fs.stat(filePath);
        const modified = stats.mtimeMs;

        if (jsonReadings.length === 0 || lastModified === null || modified > lastModified) {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            try {
                jsonReadings = JSON.parse(fileContent) as Reading[];
                lastModified = modified;
                syntheticDataCache.clear(); // Clear cache on file change
            } catch (parseError) {
                console.error('Error parsing readings.json:', parseError);
                jsonReadings = [];
                await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
            }
        }

        return jsonReadings;
    } catch (error) {
        console.error('Error reading readings.json:', error);
        jsonReadings = [];
        return jsonReadings;
    }
}

async function getDummyRealtimeReadings(): Promise<Reading[]> {
    const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
    try {
        if (!existsSync(filePath)) {
            dummyReadings = [];
            await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
            return dummyReadings;
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        dummyReadings = JSON.parse(fileContent) as Reading[];
        return dummyReadings;
    } catch (error) {
        console.error('Error reading realtime.json:', error);
        dummyReadings = [];
        return dummyReadings;
    }
}

function watchReadingsFile() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');
    if (existsSync(filePath)) {
        const debouncedGetJsonReadings = debounce(getJsonReadings, 500);
        watch(filePath, async (event) => {
            if (event === 'change') {
                await debouncedGetJsonReadings();
            }
        });
    }
}

if (USE_DUMMY_REALTIME) {
    getDummyRealtimeReadings();
    setInterval(updateDummyReadings, 5000);
}
watchReadingsFile();

async function getAllReadings(): Promise<Reading[]> {
    if (USE_DUMMY_REALTIME) {
        if (!dummyReadings.length) {
            await getDummyRealtimeReadings();
            if (!dummyReadings.length) {
                dummyReadings.push(generateDummyReading(new Date().toISOString()));
                await writeDummyReadingsToFile();
            }
        }
        return dummyReadings;
    }

    if (USE_DUMMY_JSON || USE_REALTIME) {
        const readings = await getJsonReadings();
        if (!readings.length) {
            return [generateDummyReading(new Date().toISOString())];
        }
        return readings;
    }

    return getJsonReadings();
}

function convertReadingsToDeviceData(readings: Reading[]): DeviceData {
    const cacheKey = readings.map((r) => r.timestamp).join('|');
    if (syntheticDataCache.has(cacheKey)) {
        return syntheticDataCache.get(cacheKey)!;
    }

    const deviceData: DeviceData = {
        temperature: [],
        humidity: [],
        pm25: [],
        voc: [],
        o3: [],
        co: [],
        co2: [],
        no2: [],
        so2: [],
        timestamp: [],
    };

    readings.forEach((reading) => {
        deviceData.timestamp.push(reading.timestamp);

        // Use 0 for missing or non-toggled values to satisfy number[]
        deviceData.temperature.push(
            parameterToggles.temperature && reading['Temperature (°C)'] !== undefined
                ? reading['Temperature (°C)']
                : 0
        );
        deviceData.humidity.push(
            parameterToggles.humidity && reading['Humidity (%)'] !== undefined
                ? reading['Humidity (%)']
                : 0
        );
        deviceData.co2.push(
            parameterToggles.co2 && reading['CO2 (ppm)'] !== undefined
                ? reading['CO2 (ppm)']
                : 0
        );
        deviceData.pm25.push(
            parameterToggles.pm25 && reading['PM2.5 (ug/m3)'] !== undefined
                ? reading['PM2.5 (ug/m3)']
                : 0
        );

        // Non-toggled parameters default to 0
        deviceData.voc.push(0);
        deviceData.o3.push(0);
        deviceData.co.push(0);
        deviceData.no2.push(0);
        deviceData.so2.push(0);
    });

    syntheticDataCache.set(cacheKey, deviceData);
    return deviceData;
}

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const deviceCode = url.searchParams.get('deviceCode');
        const timeFilter = url.searchParams.get('timeFilter') || 'all';

        if (!deviceCode) {
            return NextResponse.json({ error: 'Device code is required' }, { status: 400 });
        }

        const allReadings = await getAllReadings();

        if (!allReadings.length) {
            return NextResponse.json({ error: 'No readings available' }, { status: 404 });
        }

        const sortedReadings = allReadings.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let filteredReadings = sortedReadings;
        const now = new Date();

        switch (timeFilter) {
            case '1h':
                filteredReadings = sortedReadings.filter(
                    (r) => now.getTime() - new Date(r.timestamp).getTime() <= 3600 * 1000
                );
                break;
            case '6h':
                filteredReadings = sortedReadings.filter(
                    (r) => now.getTime() - new Date(r.timestamp).getTime() <= 6 * 3600 * 1000
                );
                break;
            case '24h':
                filteredReadings = sortedReadings.filter(
                    (r) => now.getTime() - new Date(r.timestamp).getTime() <= 24 * 3600 * 1000
                );
                break;
            case '10':
                filteredReadings = sortedReadings.slice(-10);
                break;
            case '30':
                filteredReadings = sortedReadings.slice(-30);
                break;
            case 'all':
            default:
                break;
        }

        if (!filteredReadings.length) {
            filteredReadings = [sortedReadings[sortedReadings.length - 1]];
        }

        const deviceData = convertReadingsToDeviceData(filteredReadings);

        return new NextResponse(JSON.stringify(deviceData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, must-revalidate',
                'Pragma': 'no-cache',
            },
        });
    } catch (error) {
        console.error('Error handling reading data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}