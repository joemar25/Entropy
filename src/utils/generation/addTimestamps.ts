// usage: npx tsc src/utils/generation/addTimestamps.ts
//    or: npx ts-node --compiler-options '{"module":"CommonJS"}' src/utils/generation/addTimestamps.ts

import * as fs from 'fs'
import * as path from 'path'

interface Reading {
    "CO (ppm)": number
    "CO2 (ppm)": number
    "O3 (ppm)": number
    "SO2 (ppm)": number
    "NO2 (ppm)": number
    "VOCs (ppm)": number
    "PM2.5 (ug/m3)": number
    timestamp?: string
}

const filePath = path.join(__dirname, 'readings.json')
const rawData = fs.readFileSync(filePath, 'utf-8')
const readings: Reading[] = JSON.parse(rawData)

// Set base time to April 17, 2025, 1:00 PM in your local timezone
// Note: If you need a specific timezone, you'll need to adjust this
const baseTime = new Date('2025-04-18T16:22:00')

const updatedReadings = readings.map((reading, index) => {
    const timestamp = new Date(baseTime.getTime() + index * 30 * 1000) // 30 sec interval
    return {
        ...reading,
        timestamp: timestamp.toISOString()
    }
})

const outputPath = path.join(__dirname, 'readings-with-timestamps.json')
fs.writeFileSync(outputPath, JSON.stringify(updatedReadings, null, 2))
console.log(`✅ Timestamps added to ${readings.length} readings (30s interval from 1:00 PM)`)
// 2025 4 17 - 1:00 co
// 2025 4 17 - 08:00 co2
// 2025 4 17 - 11:03 so2
// 2025 4 18 - 09:22 no2
// 2025 4 18 - 01:05 vocs
// 2025 4 18 - 04:22 pm2.5
