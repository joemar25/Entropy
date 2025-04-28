'use client';

import type { ChartDataPoint } from '@/types/device';
import ChartCard from '@/components/custom/dashboard/chart-card';
import CustomTooltip from '@/components/custom/dashboard/custom-tooltip';
import { styles as chartStyles } from '@/utils/styles'; // Assuming this is a different styles export
import { metrics } from '@/constants/metric';
import { useState, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid, Legend } from 'recharts';
import { formatDateTime } from '@/utils/date';
import html2canvas from 'html2canvas';
import { styles } from '@/utils/styles';
import { Button } from '@/components/ui/button';

interface ZoomEvent {
    activeLabel?: string;
    dataKey?: string;
}

interface ChartProps {
    data: ChartDataPoint[];
    timeFilter: string;
    onTimeFilterChangeAction: (value: string) => void;
    timeFilters: Array<{ value: string; label: string }>;
    selectedMetrics?: string[];
    onRefresh?: () => void;
}

interface ZoomState {
    left: string | number;
    right: string | number;
    refAreaLeft: string;
    refAreaRight: string;
    top: string | number;
    bottom: string | number;
    animation: boolean;
}

export function DashboardLineChart({
    data,
    selectedMetrics = [],
    onRefresh,
}: ChartProps) {
    const [highlightedMetric] = useState<string | null>(null);
    const [zoomState, setZoomState] = useState<ZoomState>({
        left: 'dataMin',
        right: 'dataMax',
        refAreaLeft: '',
        refAreaRight: '',
        top: 'dataMax',
        bottom: 'dataMin',
        animation: true,
    });
    const chartRef = useRef<HTMLDivElement>(null);

    // Limit data to 100 points
    const limitedData = data.slice(-100);
    const isDataLimited = data.length > 100;

    const handleZoomStart = useCallback((event: ZoomEvent) => {
        const label = event?.activeLabel;
        if (!label) return;

        setZoomState((prev) => ({
            ...prev,
            refAreaLeft: label,
        }));
    }, []);

    const handleZoomMove = useCallback(
        (event: ZoomEvent) => {
            const label = event?.activeLabel;
            if (!label || !zoomState.refAreaLeft) return;

            setZoomState((prev) => ({
                ...prev,
                refAreaRight: label,
            }));
        },
        [zoomState.refAreaLeft]
    );

    const handleZoomEnd = useCallback(() => {
        if (!zoomState.refAreaLeft || !zoomState.refAreaRight) {
            return;
        }

        const left = zoomState.refAreaLeft;
        const right = zoomState.refAreaRight;

        setZoomState((prev) => ({
            ...prev,
            refAreaLeft: '',
            refAreaRight: '',
            left: left > right ? right : left,
            right: left > right ? left : right,
        }));
    }, [zoomState]);

    const downloadChartAsPNG = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current);
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'line-chart.png';
            link.click();
        }
    };

    return (
        <ChartCard title="Real-time Monitoring" dataLength={limitedData.length} onRefresh={onRefresh}>
            <div className={styles.chartContainer}>
                <div ref={chartRef}>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={limitedData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                            onMouseDown={handleZoomStart}
                            onMouseMove={handleZoomMove}
                            onMouseUp={handleZoomEnd}
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
                                domain={[zoomState.left, zoomState.right]}
                                tickFormatter={(tick) => formatDateTime(tick, isDataLimited)}
                            />
                            <YAxis yAxisId="left" orientation="left" stroke="#888888" tick={{ fill: '#888888' }} />
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
                                .filter((metric) => selectedMetrics.length === 0 || selectedMetrics.includes(metric.key))
                                .map((metric) => (
                                    <Line
                                        key={metric.key}
                                        type="monotone"
                                        dataKey={metric.key}
                                        name={metric.name}
                                        stroke={metric.color}
                                        yAxisId="left"
                                        dot={false}
                                        strokeWidth={highlightedMetric === metric.key ? 3 : 1.5}
                                        opacity={highlightedMetric ? (highlightedMetric === metric.key ? 1 : 0.3) : 1}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                        className={chartStyles.chartLine} // Use chartStyles for chartLine
                                        isAnimationActive={true}
                                        animationDuration={200}
                                        animationEasing="ease-in-out"
                                    />
                                ))}
                            {zoomState.refAreaLeft && zoomState.refAreaRight && (
                                <ReferenceArea
                                    yAxisId="left"
                                    x1={zoomState.refAreaLeft}
                                    x2={zoomState.refAreaRight}
                                    strokeOpacity={0.3}
                                />
                            )}
                        </LineChart>
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