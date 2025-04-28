export interface Metric {
    key: string;
    name: string;
    unit: string;
    color: string;
    description: string;
    dotClass: string;
}

export const metrics: Metric[] = [
    {
        key: 'temperature',
        name: 'Temperature',
        unit: '°C',
        color: '#3b82f6',
        description: 'Temperature indicates the current ambient temperature in degrees Celsius.',
        dotClass: 'tooltipDot--temperature',
    },
    {
        key: 'humidity',
        name: 'Humidity',
        unit: '%',
        color: '#10b981',
        description: 'Humidity represents the amount of water vapor in the air as a percentage.',
        dotClass: 'tooltipDot--humidity',
    },
    {
        key: 'pm25',
        name: 'PM2.5',
        unit: 'µg/m³',
        color: '#ef4444',
        description:
            'PM2.5 refers to particulate matter that is less than 2.5 micrometers in diameter, which can affect air quality and health.',
        dotClass: 'tooltipDot--pm25',
    },
    {
        key: 'voc',
        name: 'VOC',
        unit: 'ppm',
        color: '#f59e0b',
        description:
            'Volatile Organic Compounds (VOC) are organic chemicals that have a high vapor pressure at room temperature.',
        dotClass: 'tooltipDot--voc',
    },
    {
        key: 'o3',
        name: 'O3',
        unit: 'ppm',
        color: '#8b5cf6',
        description: "Ozone (O3) is a gas composed of three oxygen atoms, often found in the Earth's stratosphere.",
        dotClass: 'tooltipDot--o3',
    },
    {
        key: 'co',
        name: 'CO',
        unit: 'ppm',
        color: '#ec4899',
        description:
            'Carbon Monoxide (CO) is a colorless, odorless gas that can be harmful when inhaled in large amounts.',
        dotClass: 'tooltipDot--co',
    },
    {
        key: 'co2',
        name: 'CO2',
        unit: 'ppm',
        color: '#6b7280',
        description:
            'Carbon Dioxide (CO2) is a naturally occurring gas, also a byproduct of burning fossil fuels and biomass.',
        dotClass: 'tooltipDot--co2',
    },
    {
        key: 'no2',
        name: 'NO2',
        unit: 'ppm',
        color: '#14b8a6',
        description:
            'Nitrogen Dioxide (NO2) is a reddish-brown gas with a characteristic sharp, biting odor and is a prominent air pollutant.',
        dotClass: 'tooltipDot--no2',
    },
    {
        key: 'so2',
        name: 'SO2',
        unit: 'ppm',
        color: '#f97316',
        description:
            'Sulfur Dioxide (SO2) is a toxic gas with a pungent, irritating smell, released by volcanic activity and industrial processes.',
        dotClass: 'tooltipDot--so2',
    },
];



// old code
// import { styles } from '@/utils/styles'

// export const metrics = [
//     { key: 'temperature', color: '#06b6d4', name: 'Temperature (°C)', dotClass: styles['tooltipDot--temperature'] },
//     { key: 'humidity', color: '#8b5cf6', name: 'Humidity (%)', dotClass: styles['tooltipDot--humidity'] },
//     { key: 'pm25', color: '#ef4444', name: 'PM2.5 (µg/m³)', dotClass: styles['tooltipDot--pm25'] },
//     { key: 'voc', color: '#f59e0b', name: 'VOC (ppm)', dotClass: styles['tooltipDot--voc'] },
//     { key: 'o3', color: '#10b981', name: 'O₃ (ppm)', dotClass: styles['tooltipDot--o3'] },
//     { key: 'co', color: '#6366f1', name: 'CO (ppm)', dotClass: styles['tooltipDot--co'] },
//     { key: 'co2', color: '#ec4899', name: 'CO₂ (ppm)', dotClass: styles['tooltipDot--co2'] },
//     { key: 'no2', color: '#14b8a6', name: 'NO₂ (ppm)', dotClass: styles['tooltipDot--no2'] },
//     { key: 'so2', color: '#f97316', name: 'SO₂ (ppm)', dotClass: styles['tooltipDot--so2'] }
// ] as const