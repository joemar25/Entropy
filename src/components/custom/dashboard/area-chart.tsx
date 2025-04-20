'use client'

import type { ChartDataPoint } from '@/types/device'

import ChartCard from '@/components/custom/dashboard/chart-card'
import CustomTooltip from '@/components/custom/dashboard/custom-tooltip'

import { useState } from 'react'
import { styles } from '@/utils/styles'
import { metrics } from '@/constants/metric'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface AreaChartProps {
    data: ChartDataPoint[]
    selectedMetrics: string[]
    onRefresh?: () => void
}

export function DashboardAreaChart({
    data,
    selectedMetrics,
    onRefresh
}: AreaChartProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <ChartCard
            title="Area Chart"
            dataLength={data.length}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded(!isExpanded)}
            onRefresh={onRefresh}
        >
            <ResponsiveContainer width='100%' height={300}>
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='time' />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {metrics
                        .filter(metric => selectedMetrics.includes(metric.key))
                        .map((metric) => (
                            <Area
                                key={metric.key}
                                type='monotone'
                                dataKey={metric.key}
                                name={metric.name}
                                stroke={metric.color}
                                fill={metric.color}
                                fillOpacity={0.3}
                                className={styles.chartLine}
                            />
                        ))}
                </AreaChart>
            </ResponsiveContainer>
        </ChartCard>
    )
}