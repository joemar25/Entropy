'use client';

import type { ChartDataPoint } from '@/types/device';
import ChartCard from '@/components/custom/dashboard/chart-card';
import CustomTooltip from '@/components/custom/dashboard/custom-tooltip';
import { styles } from '@/utils/styles';
import { metrics } from '@/constants/metric';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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
    return (
        <ChartCard title="Bar Chart" dataLength={data.length} onRefresh={onRefresh}>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" interval="preserveStartEnd" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {metrics
                        .filter((metric) => selectedMetrics.includes(metric.key))
                        .map((metric) => (
                            <Bar
                                key={metric.key}
                                dataKey={metric.key}
                                name={metric.name}
                                fill={metric.color}
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