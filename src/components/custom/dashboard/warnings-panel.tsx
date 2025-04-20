'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDateTime } from '@/utils/date'
import type { DeviceData, Warning } from '@/types/device'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const thresholds = {
    temperature: { low: 22, high: 28, unit: '°C' },
    humidity: { low: 40, high: 60, unit: '%' },
    pm25: { low: 0, high: 4, unit: 'µg/m³' },
    voc: { low: 0, high: 0.05, unit: 'ppm' },
    o3: { low: 0, high: 0.3, unit: 'ppm' },
    co: { low: 0, high: 8.73, unit: 'ppm' },
    co2: { low: 0, high: 500, unit: 'ppm' },
    no2: { low: 0, high: 5, unit: 'ppm' },
    so2: { low: 0, high: 5, unit: 'ppm' }
}

const analyzeData = (data: DeviceData): Warning[] => {
    const warnings: Warning[] = []

    if (!data || !data.timestamp || data.timestamp.length === 0) return warnings;

    Object.entries(thresholds).forEach(([key, threshold]) => {
        const values = data[key as keyof DeviceData];
        if (!Array.isArray(values) || values.length === 0) return;

        values.forEach((value, index) => {
            const numericValue = Number(value);
            if (isNaN(numericValue)) return;

            const timestamp = data.timestamp[index];

            if (numericValue > threshold.high) {
                warnings.push({
                    title: `High ${key.toUpperCase()}`,
                    message: `Value: ${numericValue.toFixed(1)}${threshold.unit} (Threshold: ${threshold.high}${threshold.unit})`,
                    timestamp,
                });
            } else if (numericValue < threshold.low && threshold.low > 0) {
                warnings.push({
                    title: `Low ${key.toUpperCase()}`,
                    message: `Value: ${numericValue.toFixed(1)}${threshold.unit} (Threshold: ${threshold.low}${threshold.unit})`,
                    timestamp,
                });
            }
        });
    });

    return warnings;
};

const filterWarningsByTime = (warnings: Warning[], timeframeMs: number) => {
    const now = Date.now();
    const cutoffTime = now - timeframeMs;

    return warnings.filter(warning => {
        const warningTime = new Date(warning.timestamp).getTime();
        return warningTime >= cutoffTime;
    });
};

export const WarningsPanel = ({ data, warningHistory }: { data: DeviceData | null; warningHistory: Warning[] }) => {
    const [showWarnings, setShowWarnings] = useState(true);
    const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
    const [detectedWarnings, setDetectedWarnings] = useState<Warning[]>([]);
    const [activeWarnings, setActiveWarnings] = useState<Warning[]>([]);

    useEffect(() => {
        if (!data) return;

        const warnings = analyzeData(data);
        setDetectedWarnings(warnings);

        const active: Warning[] = [];
        if (data.timestamp.length > 0) {
            const latestIdx = data.timestamp.length - 1;

            Object.entries(thresholds).forEach(([key, threshold]) => {
                const values = data[key as keyof DeviceData];
                if (!Array.isArray(values)) return;

                const latestValue = Number(values[latestIdx]);
                if (isNaN(latestValue)) return;

                if (latestValue > threshold.high) {
                    active.push({
                        title: `High ${key.toUpperCase()}`,
                        message: `Current value: ${latestValue.toFixed(1)}${threshold.unit}`,
                        timestamp: data.timestamp[latestIdx],
                    });
                } else if (latestValue < threshold.low && threshold.low > 0) {
                    active.push({
                        title: `Low ${key.toUpperCase()}`,
                        message: `Current value: ${latestValue.toFixed(1)}${threshold.unit}`,
                        timestamp: data.timestamp[latestIdx],
                    });
                }
            });
        }
        setActiveWarnings(active);
    }, [data]);

    const combinedWarnings = [...detectedWarnings, ...warningHistory].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const recentWarnings = filterWarningsByTime(combinedWarnings, 24 * 3600 * 1000);
    const displayWarnings = activeTab === 'recent' ? recentWarnings : combinedWarnings;

    return (
        <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h2 className="font-semibold">Threshold Alerts</h2>
                    {activeWarnings.length > 0 && (
                        <Badge variant="destructive">
                            {activeWarnings.length} Active
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWarnings(!showWarnings)}
                >
                    {showWarnings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {showWarnings && (
                <div className="space-y-4">
                    {activeWarnings.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Current Threshold Alerts</h3>
                            {activeWarnings.map((warning, index) => (
                                <Alert variant="destructive" key={`current-${index}`}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>{warning.title}</AlertTitle>
                                    <AlertDescription>{warning.message}</AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex space-x-2">
                            <Button
                                size="sm"
                                variant={activeTab === 'recent' ? "default" : "outline"}
                                onClick={() => setActiveTab('recent')}
                            >
                                Recent (24h)
                            </Button>
                            <Button
                                size="sm"
                                variant={activeTab === 'all' ? "default" : "outline"}
                                onClick={() => setActiveTab('all')}
                            >
                                All Time
                            </Button>
                        </div>

                        <ScrollArea className="h-[240px] rounded-md border">
                            <div className="space-y-2 p-4">
                                {displayWarnings.length > 0 ? (
                                    displayWarnings.map((warning, index) => (
                                        <div
                                            key={`history-${index}`}
                                            className="flex items-start justify-between rounded-lg border p-2 text-sm"
                                        >
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3 text-destructive" />
                                                    <p className="font-medium">{warning.title}</p>
                                                </div>
                                                <p className="text-muted-foreground">{warning.message}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(warning.timestamp)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No {activeTab === 'recent' ? 'recent' : ''} threshold alerts
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </div>
    )
};