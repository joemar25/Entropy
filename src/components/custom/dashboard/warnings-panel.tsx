'use client';

import { useState, useEffect, useMemo } from 'react';
import { thresholds } from '@/utils/device';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DeviceData, Warning } from '@/types/device';

// Define WarningWithExplanation interface
interface WarningWithExplanation extends Warning {
    explanation: string;
    id?: string;
    isHistorical?: boolean; // Flag to differentiate historical warnings
}

// Explanation map for warnings
interface ExplanationMap {
    [key: string]: {
        high: string;
        low?: string;
    };
}

const warningExplanations: ExplanationMap = {
    temperature: {
        high: 'High temperature can reduce comfort, affect productivity, and stress sensitive individuals. Ensure proper ventilation and cooling.',
        low: 'Low temperature can cause discomfort and increase respiratory issues. Consider adjusting heating.',
    },
    humidity: {
        high: 'High humidity can promote mold growth and cause discomfort, aggravating respiratory conditions.',
        low: 'Low humidity can cause dry skin, irritated eyes, and respiratory discomfort.',
    },
    pm25: {
        high: 'Elevated PM2.5 can penetrate lungs, causing respiratory issues. Consider air filtration.',
    },
    voc: {
        high: 'High VOC levels may cause irritation, headaches, and long-term health effects. Improve ventilation.',
    },
    o3: {
        high: 'Elevated ozone can irritate the respiratory system, causing coughing and reduced lung function.',
    },
    co: {
        high: 'High carbon monoxide levels are dangerous, causing headaches, dizziness, or worse. Evacuate and ventilate immediately.',
    },
    co2: {
        high: 'Elevated CO2 can cause drowsiness and impaired cognitive function. Improve ventilation.',
    },
    no2: {
        high: 'High nitrogen dioxide can irritate airways and worsen asthma. Ensure proper ventilation.',
    },
    so2: {
        high: 'Elevated sulfur dioxide can cause respiratory irritation and aggravate heart/lung diseases.',
    },
};

// Extract key and level from warning title (e.g., "High CO2" -> { key: "co2", isHigh: true })
const parseWarningTitle = (title: string): { key: string; isHigh: boolean } | null => {
    const match = title.match(/(High|Low)\s+(\w+)/i);
    if (!match) return null;
    const [, level, key] = match;
    return { key: key.toLowerCase(), isHigh: level === 'High' };
};

// Get explanation for a warning
const getWarningExplanation = (key: string, isHigh: boolean): string => {
    if (key in warningExplanations) {
        const paramKey = key as keyof typeof warningExplanations;
        if (isHigh) {
            return warningExplanations[paramKey].high;
        } else if (warningExplanations[paramKey].low) {
            return warningExplanations[paramKey].low as string;
        }
    }
    return 'This parameter is outside the recommended range.';
};

// Analyze real-time device data to detect warnings
const analyzeData = (data: DeviceData): WarningWithExplanation[] => {
    const warnings: WarningWithExplanation[] = [];

    if (!data || !data.timestamp || data.timestamp.length === 0) return warnings;

    Object.entries(thresholds).forEach(([key, threshold]) => {
        const values = data[key as keyof DeviceData];
        if (!Array.isArray(values) || values.length === 0) return;

        values.forEach((value, index) => {
            const numericValue = Number(value);
            if (isNaN(numericValue)) return;

            const timestamp = data.timestamp[index];
            const isHigh = numericValue > threshold.high;
            const isLow = numericValue < threshold.low && threshold.low > 0;

            if (isHigh || isLow) {
                warnings.push({
                    title: `${isHigh ? 'High' : 'Low'} ${key.toUpperCase()}`,
                    message: `Value: ${numericValue.toFixed(1)}${threshold.unit} (Threshold: ${isHigh ? threshold.high : threshold.low
                        }${threshold.unit})`,
                    timestamp,
                    explanation: getWarningExplanation(key, isHigh),
                });
            }
        });
    });

    return warnings;
};

// Filter warnings by timeframe
const filterWarningsByTime = (
    warnings: WarningWithExplanation[],
    timeframeMs: number
): WarningWithExplanation[] => {
    const now = Date.now();
    const cutoffTime = now - timeframeMs;

    return warnings.filter((warning) => {
        const warningTime = new Date(warning.timestamp).getTime();
        return warningTime >= cutoffTime;
    });
};

interface WarningsPanelProps {
    data: DeviceData | null;
    warningHistory: Warning[];
}

export const WarningsPanel = ({ data, warningHistory }: WarningsPanelProps) => {
    const [showWarnings, setShowWarnings] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('warningsPanelExpanded');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });
    const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
    const [dismissedWarnings, setDismissedWarnings] = useState<string[]>([]);

    // Process historical warnings with dynamic explanations
    const typedWarningHistory = useMemo(
        () =>
            warningHistory.map((warning) => {
                const parsed = parseWarningTitle(warning.title);
                const explanation = parsed
                    ? getWarningExplanation(parsed.key, parsed.isHigh)
                    : 'Historical warning - explanation not available';
                return {
                    ...warning,
                    explanation,
                    isHistorical: true,
                };
            }) as WarningWithExplanation[],
        [warningHistory]
    );

    // Detect real-time warnings
    const detectedWarnings = useMemo(() => (data ? analyzeData(data) : []), [data]);

    // Identify active (current) warnings based on latest data
    const activeWarnings = useMemo(() => {
        if (!data || data.timestamp.length === 0) return [] as WarningWithExplanation[];

        const latestIdx = data.timestamp.length - 1;
        const active: WarningWithExplanation[] = [];

        Object.entries(thresholds).forEach(([key, threshold]) => {
            const values = data[key as keyof DeviceData];
            if (!Array.isArray(values)) return;

            const latestValue = Number(values[latestIdx]);
            if (isNaN(latestValue)) return;

            const isHigh = latestValue > threshold.high;
            const isLow = latestValue < threshold.low && threshold.low > 0;
            const warningId = `${key}-${isHigh ? 'high' : 'low'}-${data.timestamp[latestIdx]}`;

            if ((isHigh || isLow) && !dismissedWarnings.includes(warningId)) {
                active.push({
                    title: `${isHigh ? 'High' : 'Low'} ${key.toUpperCase()}`,
                    message: `Current value: ${latestValue.toFixed(1)}${threshold.unit}`,
                    timestamp: data.timestamp[latestIdx],
                    explanation: getWarningExplanation(key, isHigh),
                    id: warningId,
                });
            }
        });

        return active;
    }, [data, dismissedWarnings]);

    // Save panel state to localStorage
    useEffect(() => {
        localStorage.setItem('warningsPanelExpanded', JSON.stringify(showWarnings));
    }, [showWarnings]);

    // Combine warnings, prioritizing detectedWarnings
    const combinedWarnings = useMemo(() => {
        return [...detectedWarnings, ...typedWarningHistory].sort((a, b) => {
            // Prioritize detected warnings (not historical)
            if (!a.isHistorical && b.isHistorical) return -1;
            if (a.isHistorical && !b.isHistorical) return 1;
            // Sort by timestamp descending within same type
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [detectedWarnings, typedWarningHistory]);

    // Filter recent warnings (last 24 hours)
    const recentWarnings = useMemo(
        () => filterWarningsByTime(combinedWarnings, 24 * 3600 * 1000),
        [combinedWarnings]
    );

    const displayWarnings = activeTab === 'recent' ? recentWarnings : combinedWarnings;

    const handleDismissWarning = (warningId: string) => {
        setDismissedWarnings((prev) => [...prev, warningId]);
    };

    return (
        <TooltipProvider>
            <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h2 className="font-semibold">Threshold Alerts</h2>
                        {activeWarnings.length > 0 && (
                            <Badge variant="destructive">{activeWarnings.length} Active</Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowWarnings(!showWarnings)}
                    >
                        {showWarnings ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {showWarnings && (
                    <div className="space-y-4">
                        {activeWarnings.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Current Threshold Alerts</h3>
                                {activeWarnings.map((warning, index) => (
                                    <Alert variant="destructive" key={`current-${index}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertTitle>{warning.title}</AlertTitle>
                                                </div>
                                                <AlertDescription>{warning.message}</AlertDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                        >
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        <p>{warning.explanation}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleDismissWarning(warning.id!)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Alert>
                                ))}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant={activeTab === 'recent' ? 'default' : 'outline'}
                                    onClick={() => setActiveTab('recent')}
                                >
                                    Recent (24h)
                                </Button>
                                <Button
                                    size="sm"
                                    variant={activeTab === 'all' ? 'default' : 'outline'}
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
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 p-0"
                                                                >
                                                                    <Info className="h-3 w-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p>{warning.explanation}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
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
        </TooltipProvider>
    );
};