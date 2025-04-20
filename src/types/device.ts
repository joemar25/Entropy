// src/types/device.ts
export interface DeviceData {
    temperature: number[]
    humidity: number[]
    pm25: number[]
    voc: number[]
    o3: number[]
    co: number[]
    co2: number[]
    no2: number[]
    so2: number[]
    timestamp: string[]
}

export interface ChartDataPoint {
    time: string
    temperature: number
    humidity: number
    pm25: number
    voc: number
    o3: number
    co: number
    co2: number
    no2: number
    so2: number
}

export interface Warning {
    title: string
    message: string
    timestamp: string
}

export interface MetricDefinition {
    key: string
    name: string
    color: string
    unit: string
}