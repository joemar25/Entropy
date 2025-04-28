'use client';

import { useState, useMemo } from 'react';
import { Thermometer, Droplets, Wind, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/date';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import type { DeviceData } from '@/types/device';
import { useDownloadData } from '@/hooks/device/use-download-data';

type MetricType = 'temperature' | 'humidity' | 'pm25' | 'voc' | 'o3' | 'co' | 'co2' | 'no2' | 'so2';

interface MetricsGridProps {
    data: DeviceData;
    getCurrentValueAction: (data: DeviceData, key: keyof DeviceData) => number;
    getStatusBadgeAction: (value: number, type: MetricType) => JSX.Element;
    onMetricClick?: (metric: MetricType | null) => void;
    onRefresh?: () => void;
    selectedMetrics?: string[];
    timeFilter: string;
}

interface HistoricalDataPoint {
    value: number;
    timestamp: string;
}

export function MetricsGrid({
    data,
    getCurrentValueAction,
    getStatusBadgeAction,
    onMetricClick,
    selectedMetrics,
    timeFilter,
}: MetricsGridProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);

    const metrics = useMemo(
        () => [
            { key: 'temperature' as MetricType, label: 'Temperature', unit: '°C', icon: Thermometer },
            { key: 'humidity' as MetricType, label: 'Humidity', unit: '%', icon: Droplets },
            { key: 'pm25' as MetricType, label: 'PM2.5', unit: 'µg/m³', icon: Wind },
            { key: 'voc' as MetricType, label: 'VOC', unit: 'ppm', icon: Wind },
            { key: 'o3' as MetricType, label: 'O3', unit: 'ppm', icon: Wind },
            { key: 'co' as MetricType, label: 'CO', unit: 'ppm', icon: Wind },
            { key: 'co2' as MetricType, label: 'CO2', unit: 'ppm', icon: Wind },
            { key: 'no2' as MetricType, label: 'NO2', unit: 'ppm', icon: Wind },
            { key: 'so2' as MetricType, label: 'SO2', unit: 'ppm', icon: Wind },
        ],
        []
    );

    const filteredMetrics = useMemo(
        () => (selectedMetrics ? metrics.filter(metric => selectedMetrics.includes(metric.key)) : metrics),
        [metrics, selectedMetrics]
    );

    const historicalData = useMemo(() => {
        if (!selectedMetric || !data[selectedMetric] || !data.timestamp) return [];

        const metricData = data[selectedMetric] as number[];
        const timestamps = data.timestamp as string[];

        let filteredData = metricData.map((value, index) => ({
            value,
            timestamp: timestamps[index] || new Date().toISOString(),
        }));

        const now = Date.now();
        switch (timeFilter) {
            case '10':
            case '30':
                filteredData = filteredData.slice(-parseInt(timeFilter));
                break;
            case '1h':
                filteredData = filteredData.filter(
                    (point) => new Date(point.timestamp).getTime() >= now - 3600 * 1000
                );
                break;
            case '6h':
                filteredData = filteredData.filter(
                    (point) => new Date(point.timestamp).getTime() >= now - 6 * 3600 * 1000
                );
                break;
            case '24h':
                filteredData = filteredData.filter(
                    (point) => new Date(point.timestamp).getTime() >= now - 24 * 3600 * 1000
                );
                break;
            case 'all':
            default:
                break;
        }

        return filteredData.reverse();
    }, [selectedMetric, data, timeFilter]);

    const historicalDataTitle = useMemo(() => {
        switch (timeFilter) {
            case '10':
                return 'Last 10 Readings';
            case '30':
                return 'Last 30 Readings';
            case '1h':
                return 'Last 1 Hour Readings';
            case '6h':
                return 'Last 6 Hours Readings';
            case '24h':
                return 'Last 24 Hours Readings';
            case 'all':
                return 'All Readings';
            default:
                return 'Recent Readings';
        }
    }, [timeFilter]);

    const selectedMetricLabel = metrics.find((m) => m.key === selectedMetric)?.label || selectedMetric || '';
    const selectedMetricUnit = metrics.find((m) => m.key === selectedMetric)?.unit || '';

    const { setIsDownloadDialogOpen, DownloadDialog } = useDownloadData<HistoricalDataPoint>({
        data: historicalData,
        metrics: selectedMetric ? [{ value: selectedMetric, label: `${selectedMetricLabel} (${selectedMetricUnit})` }] : [],
        selectedMetrics: selectedMetric ? [selectedMetric] : [],
        fileNamePrefix: `metric_${selectedMetric || 'data'}`,
        getHeaders: () => ['Timestamp', `${selectedMetricLabel} (${selectedMetricUnit})`],
        getRow: (item: HistoricalDataPoint) => [formatDateTime(item.timestamp), item.value.toFixed(1)],
    });

    const handleMetricClick = (metric: MetricType) => {
        const newMetric = selectedMetric === metric ? null : metric;
        setSelectedMetric(newMetric);
        onMetricClick?.(newMetric);
    };

    const handleDialogClose = () => {
        setSelectedMetric(null);
        onMetricClick?.(null);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Current Readings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMetrics.map(({ key, label, unit, icon: Icon }) => (
                    <Card
                        key={key}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${selectedMetric === key ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleMetricClick(key)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold">
                                        {getCurrentValueAction(data, key).toFixed(1)} {unit}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Last reading</p>
                                </div>
                                {getStatusBadgeAction(getCurrentValueAction(data, key), key)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={selectedMetric !== null} onOpenChange={handleDialogClose}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedMetricLabel} Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="text-4xl font-bold">
                            {selectedMetric && getCurrentValueAction(data, selectedMetric).toFixed(1)} {selectedMetricUnit}
                        </div>

                        {historicalData.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium">{historicalDataTitle}</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsDownloadDialogOpen(true)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={historicalData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(tick) => formatDateTime(tick)}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => formatDateTime(label)}
                                                formatter={(value: number) => [
                                                    `${value.toFixed(1)} ${selectedMetricUnit}`,
                                                    selectedMetric?.toUpperCase(),
                                                ]}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#3b82f6"
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
                            <p className="text-sm text-muted-foreground">
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
                                    'Sulfur Dioxide (SO2) is a toxic gas with a pungent, irritating smell, released by volcanic activity and industrial processes.'}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DownloadDialog />
        </>
    );
}