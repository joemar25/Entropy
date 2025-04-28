'use client';

import type { ChartDataPoint } from '@/types/device';
import CustomTooltip from '@/components/custom/dashboard/custom-tooltip';
import { styles } from '@/utils/styles';
import { metrics } from '@/constants/metric';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatDateTime } from '@/utils/date';
import ChartCard from './chart-card';

interface BarChartProps {
    data: ChartDataPoint[];
    selectedMetrics: string[];
    onRefresh?: () => void;
}

export function DashboardBarChart({
    data,
    selectedMetrics,
    onRefresh,
}: BarChartProps) {
    // Limit data to 100 points
    const limitedData = data.slice(-100);
    const isDataLimited = data.length > 100;

    return (
        <ChartCard title="Bar Chart" dataLength={limitedData.length} onRefresh={onRefresh}>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={limitedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        stroke="#888888"
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        interval="preserveStartEnd"
                        tick={{ fill: '#888888' }}
                        tickFormatter={(tick) => formatDateTime(tick, isDataLimited)}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#888888"
                        tick={{ fill: '#888888' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{
                            paddingBottom: '20px',
                            fontSize: '12px',
                        }}
                    />
                    {metrics
                        .filter((metric) => selectedMetrics.includes(metric.key))
                        .map((metric) => (
                            <Bar
                                key={metric.key}
                                dataKey={metric.key}
                                name={metric.name}
                                fill={metric.color}
                                yAxisId="left" // Added to match YAxis yAxisId
                                className={styles.chartLine}
                                isAnimationActive={true}
                                animationDuration={200}
                                animationEasing="ease-in-out"
                            />
                        ))}
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}