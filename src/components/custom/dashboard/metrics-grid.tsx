'use client'

import type { DeviceData } from '@/types/device'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Thermometer, Droplets, Wind, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDateTime } from '@/utils/date'

// Recharts import
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts'

type MetricType = 'temperature' | 'humidity' | 'pm25' | 'voc' | 'o3' | 'co' | 'co2' | 'no2' | 'so2'

interface MetricsGridProps {
    data: DeviceData
    getCurrentValueAction: (data: DeviceData, key: keyof DeviceData) => number
    getStatusBadgeAction: (value: number, type: MetricType) => JSX.Element
    onMetricClick?: (metric: MetricType | null) => void
    onRefresh?: () => void
    selectedMetrics?: string[]
}

export function MetricsGrid({
    data,
    getCurrentValueAction,
    getStatusBadgeAction,
    onMetricClick,
    onRefresh,
    selectedMetrics
}: MetricsGridProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)

    const metrics: Array<{
        key: MetricType
        label: string
        unit: string
        icon: typeof Wind
    }> = [
            { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer },
            { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets },
            { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', icon: Wind },
            { key: 'voc', label: 'VOC', unit: 'ppm', icon: Wind },
            { key: 'o3', label: 'O3', unit: 'ppm', icon: Wind },
            { key: 'co', label: 'CO', unit: 'ppm', icon: Wind },
            { key: 'co2', label: 'CO2', unit: 'ppm', icon: Wind },
            { key: 'no2', label: 'NO2', unit: 'ppm', icon: Wind },
            { key: 'so2', label: 'SO2', unit: 'ppm', icon: Wind },
        ]

    const handleMetricClick = (metric: MetricType) => {
        const newMetric = selectedMetric === metric ? null : metric
        setSelectedMetric(newMetric)
        onMetricClick?.(newMetric)
    }

    const handleDialogClose = () => {
        setSelectedMetric(null)
        onMetricClick?.(null)
    }

    const getHistoricalData = () => {
        if (!selectedMetric || !data[selectedMetric] || !data.timestamp) return []

        const metricData = data[selectedMetric] as number[]
        const timestamps = data.timestamp as string[]

        const last10Readings = metricData.slice(-10).map((value, index) => ({
            value,
            timestamp: timestamps[timestamps.length - 10 + index] || new Date().toISOString()
        })).reverse()

        return last10Readings
    }

    const historicalData = getHistoricalData()

    // Filter metrics based on selectedMetrics prop if provided
    const filteredMetrics = selectedMetrics
        ? metrics.filter(metric => selectedMetrics.includes(metric.key))
        : metrics;

    return (
        <>
            <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg font-semibold'>Current Readings</h2>
                {onRefresh && (
                    <Button variant='outline' size='icon' onClick={onRefresh}>
                        <RefreshCw className='h-4 w-4' />
                    </Button>
                )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                {filteredMetrics.map(({ key, label, unit, icon: Icon }) => (
                    <Card
                        key={key}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedMetric === key ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleMetricClick(key)}
                    >
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>{label}</CardTitle>
                            <Icon className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <div className='text-2xl font-bold'>
                                        {getCurrentValueAction(data, key).toFixed(1)} {unit}
                                    </div>
                                    <p className='text-xs text-muted-foreground'>Last reading</p>
                                </div>
                                {getStatusBadgeAction(getCurrentValueAction(data, key), key)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={selectedMetric !== null} onOpenChange={handleDialogClose}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>
                            {metrics.find(m => m.key === selectedMetric)?.label} Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className='py-4 space-y-4'>
                        <div className='text-4xl font-bold'>
                            {selectedMetric && getCurrentValueAction(data, selectedMetric).toFixed(1)}{' '}
                            {metrics.find(m => m.key === selectedMetric)?.unit}
                        </div>

                        {historicalData.length > 0 && (
                            <div>
                                <h3 className='font-medium mb-2'>Last 10 Readings</h3>
                                <div className='h-64'>
                                    <ResponsiveContainer width='100%' height='100%'>
                                        <LineChart data={historicalData}>
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis
                                                dataKey='timestamp'
                                                tickFormatter={(tick) => formatDateTime(tick)}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => formatDateTime(label)}
                                                formatter={(value: number) => [
                                                    `${value.toFixed(1)} ${metrics.find(m => m.key === selectedMetric)?.unit
                                                    }`,
                                                    selectedMetric?.toUpperCase()
                                                ]}
                                            />
                                            <Line
                                                type='monotone'
                                                dataKey='value'
                                                stroke='#3b82f6'
                                                strokeWidth={2}
                                                dot={{ r: 3 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        <div>
                            <p className='text-sm text-muted-foreground'>
                                {selectedMetric === 'temperature' &&
                                    'Temperature indicates the current ambient temperature in degrees Celsius.'}
                                {selectedMetric === 'humidity' &&
                                    'Humidity represents the amount of water vapor in the air as a percentage.'}
                                {selectedMetric === 'pm25' &&
                                    'PM2.5 refers to particulate matter that is less than 2.5 micrometers in diameter, which can affect air quality and health.'}
                                {selectedMetric === 'voc' &&
                                    'Volatile Organic Compounds (VOC) are organic chemicals that have a high vapor pressure at room temperature.'}
                                {selectedMetric === 'o3' &&
                                    'Ozone (O3) is a gas composed of three oxygen atoms, often found in the Earth\'s stratosphere.'}
                                {selectedMetric === 'co' &&
                                    'Carbon Monoxide (CO) is a colorless, odorless gas that can be harmful when inhaled in large amounts.'}
                                {selectedMetric === 'co2' &&
                                    'Carbon Dioxide (CO2) is a naturally occurring gas, also a byproduct of burning fossil fuels and biomass.'}
                                {selectedMetric === 'no2' &&
                                    'Nitrogen Dioxide (NO2) is a reddish-brown gas with a characteristic sharp, biting odor and is a prominent air pollutant.'}
                                {selectedMetric === 'so2' &&
                                    'Sulfur Dioxide (SO2) is a toxic gas with a pungent, irritating smell, and is released by volcanic activity and industrial processes.'}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}