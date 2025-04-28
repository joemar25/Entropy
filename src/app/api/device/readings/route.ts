import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { watch } from 'fs';
import type { NextRequest } from 'next/server';
import type { DeviceData } from '@/types/device';

// Define Reading interface
interface Reading {
    'CO (ppm)': number;
    'CO2 (ppm)': number;
    'O3 (ppm)': number;
    'SO2 (ppm)': number;
    'NO2 (ppm)': number;
    'VOCs (ppm)': number;
    'PM2.5 (ug/m3)': number;
    timestamp: string;
}

// Configuration for data source
const USE_DUMMY_REALTIME = true; // Set to false to disable dummy real-time data
const USE_DUMMY_JSON = false; // Set to true to use dummy JSON data without appending
const USE_REALTIME = false;

// Validate environment configuration
if (USE_DUMMY_REALTIME && USE_REALTIME) {
    console.warn('Both DUMMY_REALTIME and REALTIME are true. Prioritizing DUMMY_REALTIME.');
}
if (USE_DUMMY_REALTIME && USE_DUMMY_JSON) {
    console.warn('Both DUMMY_REALTIME and DUMMY_JSON are true. Prioritizing DUMMY_REALTIME.');
}

// In-memory cache for JSON readings and dummy readings
let jsonReadings: Reading[] = []; // Cache for readings.json
let dummyReadings: Reading[] = []; // Cache for dummy data
let lastModified: number | null = null;

// Generate dummy real-time reading
function generateDummyReading(timestamp: string): Reading {
    return {
        'CO (ppm)': Math.random() * 0.5,
        'CO2 (ppm)': 400 + Math.random() * 50,
        'O3 (ppm)': Math.random() * 0.1,
        'SO2 (ppm)': Math.random() * 0.1,
        'NO2 (ppm)': Math.random() * 0.1,
        'VOCs (ppm)': Math.random() * 0.2,
        'PM2.5 (ug/m3)': 0.1 + Math.random() * 5,
        timestamp,
    };
}

// Write dummy readings to realtime.json
async function writeDummyReadingsToFile() {
    if (USE_DUMMY_REALTIME) {
        const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
        try {
            await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
            console.log('Updated realtime.json with dummy readings');
        } catch (error) {
            console.error('Error writing to realtime.json:', error);
        }
    }
}

// Simulate real-time updates by appending new dummy readings
async function updateDummyReadings() {
    if (USE_DUMMY_REALTIME) {
        const now = new Date().toISOString();
        const newReading = generateDummyReading(now);
        dummyReadings.push(newReading);
        // Keep only the last 100 readings to prevent memory bloat
        if (dummyReadings.length > 100) {
            dummyReadings.shift();
        }
        console.log('Generated new dummy reading:', newReading);
        await writeDummyReadingsToFile(); // Write to realtime.json
    }
}

// Read JSON file and return all readings
async function getJsonReadings(): Promise<Reading[]> {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');

        if (!existsSync(filePath)) {
            console.warn('readings.json not found, initializing empty JSON file');
            jsonReadings = [];
            await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
            return jsonReadings;
        }

        const stats = await fs.stat(filePath);
        const modified = stats.mtimeMs;

        // Only read file if it has changed or cache is empty
        if (jsonReadings.length === 0 || lastModified === null || modified > lastModified) {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            try {
                jsonReadings = JSON.parse(fileContent) as Reading[];
                lastModified = modified;
                console.log('Loaded readings from JSON (read-only):', jsonReadings.length);
            } catch (parseError) {
                console.error('Error parsing readings.json:', parseError);
                console.error('Problematic JSON content:', fileContent.slice(0, 500), '...'); // Log first 500 chars
                console.warn('Initializing new empty readings.json due to parsing failure');
                jsonReadings = [];
                await fs.writeFile(filePath, JSON.stringify(jsonReadings, null, 2), 'utf-8');
            }
        }

        return jsonReadings;
    } catch (error) {
        console.error('Error reading readings.json:', error);
        jsonReadings = []; // Reset JSON cache on error
        return jsonReadings;
    }
}

// Read or initialize realtime.json for dummy real-time data
async function getDummyRealtimeReadings(): Promise<Reading[]> {
    const filePath = path.join(process.cwd(), 'src', 'data', 'realtime.json');
    try {
        if (!existsSync(filePath)) {
            console.log('realtime.json not found, initializing empty file');
            dummyReadings = [];
            await fs.writeFile(filePath, JSON.stringify(dummyReadings, null, 2), 'utf-8');
            return dummyReadings;
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        dummyReadings = JSON.parse(fileContent) as Reading[];
        console.log('Loaded readings from realtime.json:', dummyReadings.length);
        return dummyReadings;
    } catch (error) {
        console.error('Error reading realtime.json:', error);
        dummyReadings = [];
        return dummyReadings;
    }
}

// Watch readings.json for changes
function watchReadingsFile() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json');
    if (existsSync(filePath)) {
        watch(filePath, async (event) => {
            if (event === 'change') {
                console.log('readings.json changed, updating JSON cache (read-only)');
                await getJsonReadings();
            }
        });
    } else {
        console.warn('readings.json not found, file watcher not started');
    }
}

// Initialize file watcher and dummy data updates
if (USE_DUMMY_REALTIME) {
    // Initialize realtime.json if it doesn't exist
    getDummyRealtimeReadings();
    setInterval(updateDummyReadings, 5000); // Update every 5 seconds
}
watchReadingsFile();

// Get readings based on configuration
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

    if (USE_DUMMY_JSON) {
        const readings = await getJsonReadings();
        if (!readings.length) {
            console.log('No readings in readings.json, returning single dummy reading');
            return [generateDummyReading(new Date().toISOString())];
        }
        return readings; // Use readings.json without appending
    }

    if (USE_REALTIME) {
        console.warn('Real-time data fetching not implemented, falling back to JSON data');
        return getJsonReadings();
    }

    return getJsonReadings();
}

// Convert readings to DeviceData format
function convertReadingsToDeviceData(readings: Reading[]): DeviceData {
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

    readings.forEach((reading, index) => {
        const temperature = 22 + Math.sin(index / 5) * 2 + Math.random() * 0.5;
        const humidity = 45 + Math.cos(index / 4) * 10 + Math.random() * 2;

        deviceData.temperature.push(Number(temperature.toFixed(2)));
        deviceData.humidity.push(Number(humidity.toFixed(2)));
        deviceData.pm25.push(reading['PM2.5 (ug/m3)']);
        deviceData.voc.push(reading['VOCs (ppm)']);
        deviceData.o3.push(reading['O3 (ppm)']);
        deviceData.co.push(reading['CO (ppm)']);
        deviceData.co2.push(reading['CO2 (ppm)']);
        deviceData.no2.push(reading['NO2 (ppm)']);
        deviceData.so2.push(reading['SO2 (ppm)']);
        deviceData.timestamp.push(reading.timestamp);
    });

    return deviceData;
}

// API Handler
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

        // Sort readings by timestamp (ascending)
        const sortedReadings = allReadings.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Apply time-based filtering
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
            console.log(`No data for ${timeFilter}, returning most recent reading`);
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