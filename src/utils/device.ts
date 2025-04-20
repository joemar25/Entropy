// src/utils/device.ts
import type { DeviceData } from '@/types/device'

// Define thresholds for air quality parameters - ensure these match those in Dashboard
export const thresholds = {
    temperature: { low: 22, high: 28, unit: '°C' },
    humidity: { low: 40, high: 60, unit: '%' },
    pm25: { low: 0, high: 4, unit: 'µg/m³' },
    voc: { low: 0, high: 0.05, unit: 'ppm' },
    o3: { low: 0, high: 0.3, unit: 'ppm' },
    co: { low: 0, high: 8.73, unit: 'ppm' },
    co2: { low: 0, high: 500, unit: 'ppm' },
    no2: { low: 0, high: 5, unit: 'ppm' },
    so2: { low: 0, high: 5, unit: 'ppm' }
}

// Function to check for warnings based on thresholds
export const getWarnings = (data: DeviceData): Array<{ title: string; message: string }> => {
    const warnings: Array<{ title: string; message: string }> = []

    Object.entries(thresholds).forEach(([key, threshold]) => {
        const values = data[key as keyof DeviceData]
        if (Array.isArray(values) && values.length > 0) {
            const latestValue = Number(values[values.length - 1])

            // Skip if not a valid number
            if (isNaN(latestValue)) return

            if (latestValue > threshold.high) {
                warnings.push({
                    title: `High ${key.toUpperCase()}`,
                    message: `Current: ${latestValue.toFixed(1)}${threshold.unit} (Threshold: ${threshold.high}${threshold.unit})`
                })
            } else if (latestValue < threshold.low && threshold.low > 0) {
                warnings.push({
                    title: `Low ${key.toUpperCase()}`,
                    message: `Current: ${latestValue.toFixed(1)}${threshold.unit} (Threshold: ${threshold.low}${threshold.unit})`
                })
            }
        }
    })

    return warnings
}