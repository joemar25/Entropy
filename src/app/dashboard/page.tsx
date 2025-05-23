'use client';

import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useMemo } from 'react';
import { getWarnings, thresholds } from '@/utils/device';
import { useDeviceCode } from '@/hooks/device/use-device-code';
import { useDeviceData } from '@/hooks/device/use-device-data';
import { DashboardLineChart } from '@/components/custom/dashboard/chart';
import { ErrorState } from '@/components/custom/dashboard/status/error';
import { MetricsGrid } from '@/components/custom/dashboard/metrics-grid';
import { DashboardBarChart } from '@/components/custom/dashboard/bar-chart';
import { LoadingState } from '@/components/custom/dashboard/status/loading';
import { FilterToolbar } from '@/components/custom/dashboard/filter-toolbar';
import { WarningsPanel } from '@/components/custom/dashboard/warnings-panel';
import { DashboardAreaChart } from '@/components/custom/dashboard/area-chart';
import { useDownloadData } from '@/hooks/device/use-download-data';
import type { ChartDataPoint, DeviceData, Warning } from '@/types/device';

const timeFilters = [
    { value: '10', label: 'Last 10 readings' },
    { value: '30', label: 'Last 30 readings' },
    { value: '1h', label: 'Last 1 hour' },
    { value: '6h', label: 'Last 6 hours' },
    { value: '24h', label: 'Last 24 hours' },
    { value: 'all', label: 'All readings' },
];

interface Metric {
    value: string;
    label: string;
}

export default function Dashboard() {
    const router = useRouter();
    const { deviceCode } = useDeviceCode();
    const {
        data,
        isInitialLoading,
        error,
        refreshData,
        timeFilter,
        updateTimeFilter,
    } = useDeviceData();

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [warningHistory, setWarningHistory] = useState<Warning[]>([]);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
        'temperature',
        'humidity',
        'pm25',
        'voc',
        'o3',
        'co',
        'co2',
        'no2',
        'so2',
    ]);

    const availableMetrics: Metric[] = [
        { value: 'temperature', label: 'Temperature (°C)' },
        { value: 'humidity', label: 'Humidity (%)' },
        { value: 'pm25', label: 'PM2.5 (µg/m³)' },
        { value: 'voc', label: 'VOC (ppm)' },
        { value: 'o3', label: 'Ozone (O₃) (ppm)' },
        { value: 'co', label: 'Carbon Monoxide (CO) (ppm)' },
        { value: 'co2', label: 'Carbon Dioxide (CO₂) (ppm)' },
        { value: 'no2', label: 'Nitrogen Dioxide (NO₂) (ppm)' },
        { value: 'so2', label: 'Sulfur Dioxide (SO₂) (ppm)' },
    ];

    const { setIsDownloadDialogOpen, DownloadDialog } = useDownloadData<ChartDataPoint>({
        data: chartData,
        metrics: availableMetrics,
        selectedMetrics,
        fileNamePrefix: 'air_quality_data',
        getHeaders: (metrics: string[]) => [
            'Timestamp',
            ...metrics.map((metric: string) => availableMetrics.find((m) => m.value === metric)?.label || metric),
        ],
        getRow: (point: ChartDataPoint, metrics: string[]) => [
            point.time,
            ...metrics.map((metric: string) => point[metric as keyof ChartDataPoint] || 0),
        ],
    });

    const processChartData = useMemo(() => {
        if (!data) return [];

        try {
            let filteredData = [...(data.temperature || []).map((temp, index) => ({
                temperature: temp,
                humidity: data.humidity?.[index] || 0,
                pm25: data.pm25?.[index] || 0,
                voc: data.voc?.[index] || 0,
                o3: data.o3?.[index] || 0,
                co: data.co?.[index] || 0,
                co2: data.co2?.[index] || 0,
                no2: data.no2?.[index] || 0,
                so2: data.so2?.[index] || 0,
                timestamp: data.timestamp?.[index] || new Date().toISOString(),
            }))];

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

            return filteredData.map((point) => ({
                time: formatDateTime(point.timestamp),
                temperature: Number(point.temperature.toFixed(1)),
                humidity: Number(point.humidity.toFixed(1)),
                pm25: Number(point.pm25.toFixed(1)),
                voc: Number(point.voc.toFixed(1)),
                o3: Number(point.o3.toFixed(1)),
                co: Number(point.co.toFixed(1)),
                co2: Number(point.co2.toFixed(1)),
                no2: Number(point.no2.toFixed(1)),
                so2: Number(point.so2.toFixed(1)),
            }));
        } catch (error) {
            console.error('Error processing chart data:', error);
            return [];
        }
    }, [data, timeFilter]);

    useEffect(() => {
        setChartData(processChartData);
    }, [processChartData]);

    useEffect(() => {
        if (!data) return;

        const twentyFourHoursAgo = Date.now() - 24 * 3600 * 1000;
        const filteredIndices = data.timestamp
            .map((ts, index) => (new Date(ts).getTime() >= twentyFourHoursAgo ? index : -1))
            .filter((index) => index !== -1);

        const dataLast24h = {
            ...data,
            timestamp: filteredIndices.map((i) => data.timestamp[i]),
            temperature: filteredIndices.map((i) => data.temperature[i]),
            humidity: filteredIndices.map((i) => data.humidity[i]),
            pm25: filteredIndices.map((i) => data.pm25[i]),
            voc: filteredIndices.map((i) => data.voc[i]),
            o3: filteredIndices.map((i) => data.o3[i]),
            co: filteredIndices.map((i) => data.co[i]),
            co2: filteredIndices.map((i) => data.co2[i]),
            no2: filteredIndices.map((i) => data.no2[i]),
            so2: filteredIndices.map((i) => data.so2[i]),
        };

        const currentWarnings = getWarnings(dataLast24h);
        if (currentWarnings.length > 0) {
            const newWarnings = currentWarnings.map((warning) => ({
                ...warning,
                timestamp: new Date().toISOString(),
            }));
            setWarningHistory((prev) => [
                ...prev.filter((w) => new Date(w.timestamp) > new Date(twentyFourHoursAgo)),
                ...newWarnings,
            ]);
        }
    }, [data]);

    const getStatusBadge = (value: number, type: keyof typeof thresholds) => {
        const threshold = thresholds[type];
        if (value > threshold.high) return <Badge variant="destructive">High</Badge>;
        if (value < threshold.low && threshold.low > 0) return <Badge variant="default">Low</Badge>;
        return <Badge variant="secondary">Normal</Badge>;
    };

    const getCurrentValue = (data: DeviceData | null, key: keyof DeviceData): number => {
        if (!data || !Array.isArray(data[key])) return 0;
        const value = data[key][data[key].length - 1];
        return typeof value === 'number' ? value : 0;
    };

    const handleMetricToggle = (metric: string) => {
        setSelectedMetrics((prev) =>
            prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
        );
    };

    useEffect(() => {
        if (!deviceCode) {
            router.push('/');
        }
    }, [deviceCode, router]);

    if (isInitialLoading && !data) {
        return <LoadingState />;
    }

    if (error && !data) {
        return <ErrorState onRetry={refreshData} />;
    }

    const currentWarnings = data ? getWarnings(data) : [];
    const hasWarnings = warningHistory.length > 0 || currentWarnings.length > 0;

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Air Quality Dashboard</h1>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={refreshData}>
                        Refresh Data
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDownloadDialogOpen(true)}
                    >
                        Download Data
                    </Button>
                </div>
            </div>

            <DownloadDialog />

            {data && (
                <div className="space-y-6">
                    <FilterToolbar
                        timeFilter={timeFilter}
                        setTimeFilter={updateTimeFilter}
                        timeFilters={timeFilters}
                        availableMetrics={availableMetrics}
                        selectedMetrics={selectedMetrics}
                        onMetricToggle={handleMetricToggle}
                    />

                    {hasWarnings && (
                        <WarningsPanel data={data} warningHistory={warningHistory} />
                    )}

                    {/* Line Chart */}
                    <DashboardLineChart
                        data={chartData}
                        timeFilter={timeFilter}
                        onTimeFilterChangeAction={updateTimeFilter}
                        timeFilters={timeFilters}
                        selectedMetrics={selectedMetrics}
                        onRefresh={refreshData}
                    />

                    {/* Bar Chart */}
                    <DashboardBarChart
                        data={chartData}
                        selectedMetrics={selectedMetrics}
                        onRefresh={refreshData}
                    />

                    {/* Area Chart */}
                    <DashboardAreaChart
                        data={chartData}
                        onRefresh={refreshData}
                        selectedMetrics={selectedMetrics}
                    />

                    <MetricsGrid
                        data={data}
                        getCurrentValueAction={getCurrentValue}
                        getStatusBadgeAction={getStatusBadge}
                        onRefresh={refreshData}
                        selectedMetrics={selectedMetrics}
                        timeFilter={timeFilter}
                    />
                </div>
            )}
        </div>
    );
}