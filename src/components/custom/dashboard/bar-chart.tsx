'use client';

import type { ChartDataPoint } from '@/types/device';
import CustomTooltip from '@/components/custom/dashboard/custom-tooltip';
import { styles as chartStyles } from '@/utils/styles'; // Assuming this is a different styles export
import { metrics } from '@/constants/metric';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { formatDateTime } from '@/utils/date';
import ChartCard from './chart-card';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { styles } from '@/utils/styles';
import { Button } from '@/components/ui/button';

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
    const chartRef = useRef<HTMLDivElement>(null);

    const downloadChartAsPNG = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current);
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'bar-chart.png';
            link.click();
        }
    };

    return (
        <ChartCard title="Bar Chart" dataLength={limitedData.length} onRefresh={onRefresh}>
            <div className={styles.chartContainer}>
                <div ref={chartRef}>
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
                                        yAxisId="left"
                                        className={chartStyles.chartLine} // Use chartStyles for chartLine
                                        isAnimationActive={true}
                                        animationDuration={200}
                                        animationEasing="ease-in-out"
                                    />
                                ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <Button
                    onClick={downloadChartAsPNG}
                    className={styles.downloadButton}
                >
                    Download as PNG
                </Button>
            </div>
        </ChartCard>
    );
}