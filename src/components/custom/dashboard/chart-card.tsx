'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartCardProps {
    title: string;
    dataLength: number;
    onRefresh?: () => void;
    children: React.ReactNode;
}

export default function ChartCard({
    title,
    dataLength,
    onRefresh,
    children,
}: ChartCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{dataLength} points</span>
                    {onRefresh && (
                        <Button variant="outline" size="icon" onClick={onRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}