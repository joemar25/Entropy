// src/app/api/device/readings/route.ts
import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'
import type { NextRequest } from 'next/server'
import type { DeviceData } from '@/types/device'

interface Reading {
    "CO (ppm)": number
    "CO2 (ppm)": number
    "O3 (ppm)": number
    "SO2 (ppm)": number
    "NO2 (ppm)": number
    "VOCs (ppm)": number
    "PM2.5 (ug/m3)": number
    timestamp: string
}

// Read the JSON file and return all readings
async function getAllReadings(): Promise<Reading[]> {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'readings.json')

        if (!existsSync(filePath)) {
            throw new Error('readings.json file not found')
        }

        const fileContent = await fs.readFile(filePath, 'utf-8')
        const readings = JSON.parse(fileContent) as Reading[]
        return readings
    } catch (error) {
        console.error('Error reading from readings.json:', error)
        throw error
    }
}

function convertReadingsToDeviceData(readings: Reading[]): DeviceData {
    const temperature: number[] = []
    const humidity: number[] = []
    const pm25: number[] = []
    const voc: number[] = []
    const o3: number[] = []
    const co: number[] = []
    const co2: number[] = []
    const no2: number[] = []
    const so2: number[] = []
    const timestamp: string[] = []

    for (let i = 0; i < readings.length; i++) {
        const r = readings[i]

        // Generate synthetic temperature/humidity data since it's not in the JSON
        const fakeTemp = 24 + Math.sin(i / 5) * 1.5
        const fakeHum = 50 + Math.cos(i / 4) * 5

        temperature.push(parseFloat(fakeTemp.toFixed(2)))
        humidity.push(parseFloat(fakeHum.toFixed(2)))

        pm25.push(r["PM2.5 (ug/m3)"])
        voc.push(r["VOCs (ppm)"])
        o3.push(r["O3 (ppm)"])
        co.push(r["CO (ppm)"])
        co2.push(r["CO2 (ppm)"])
        no2.push(r["NO2 (ppm)"])
        so2.push(r["SO2 (ppm)"])

        // Ensure we have valid timestamps
        timestamp.push(r.timestamp ?? new Date().toISOString())
    }

    return {
        temperature,
        humidity,
        pm25,
        voc,
        o3,
        co,
        co2,
        no2,
        so2,
        timestamp,
    }
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

        // Ensure we have at least one reading to work with
        if (allReadings.length === 0) {
            return NextResponse.json({ error: 'No readings available' }, { status: 404 });
        }

        let filteredReadings = [...allReadings];

        // Apply time-based filtering using original timestamps
        const now = Date.now();

        // Check if we have any timestamps in the requested time range
        const hasRecentData = timeFilter !== 'all' &&
            timeFilter !== '10' &&
            timeFilter !== '30' &&
            allReadings.some(r => {
                const timestamp = new Date(r.timestamp).getTime();
                let timeThreshold;

                if (timeFilter === '24h') timeThreshold = now - 24 * 3600 * 1000;
                else if (timeFilter === '6h') timeThreshold = now - 6 * 3600 * 1000;
                else if (timeFilter === '1h') timeThreshold = now - 3600 * 1000;
                else return false;

                return timestamp >= timeThreshold;
            });

        // If no data in the time range and using a time-based filter, use the most recent readings
        if (timeFilter !== 'all' && !hasRecentData && (timeFilter === '1h' || timeFilter === '6h' || timeFilter === '24h')) {
            console.log(`No data for ${timeFilter}, using most recent data instead`);

            // Sort by timestamp (newest first) and take appropriate number of readings
            filteredReadings = [...allReadings].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            const count = timeFilter === '1h' ? 5 : timeFilter === '6h' ? 10 : 20;
            filteredReadings = filteredReadings.slice(0, Math.min(count, filteredReadings.length));
        } else {
            // Apply normal time-based filtering
            switch (timeFilter) {
                case '24h':
                    filteredReadings = allReadings.filter(r =>
                        new Date(r.timestamp).getTime() >= now - 24 * 3600 * 1000
                    );
                    break;
                case '6h':
                    filteredReadings = allReadings.filter(r =>
                        new Date(r.timestamp).getTime() >= now - 6 * 3600 * 1000
                    );
                    break;
                case '1h':
                    filteredReadings = allReadings.filter(r =>
                        new Date(r.timestamp).getTime() >= now - 3600 * 1000
                    );
                    break;
                case '30':
                    filteredReadings = allReadings.slice(-30);
                    break;
                case '10':
                    filteredReadings = allReadings.slice(-10);
                    break;
                case 'all':
                default:
                    // No filtering needed
                    break;
            }
        }

        // Make sure we always have at least one reading
        if (filteredReadings.length === 0) {
            console.log(`No data after filtering for ${timeFilter}, using most recent reading`);
            filteredReadings = [allReadings[allReadings.length - 1]];
        }

        // Convert readings to device data
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