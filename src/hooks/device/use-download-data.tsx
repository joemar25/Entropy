'use client';

import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface Metric {
    value: string;
    label: string;
}

interface DownloadDataProps<T> {
    data: T[];
    metrics: Metric[];
    selectedMetrics: string[];
    fileNamePrefix: string;
    getHeaders: (selectedMetrics: string[]) => string[];
    getRow: (item: T, selectedMetrics: string[]) => (string | number)[];
}

export function useDownloadData<T>({ data, selectedMetrics, fileNamePrefix, getHeaders, getRow }: DownloadDataProps<T>) {
    const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'csv' | 'excel'>('csv');

    const exportToCSV = useCallback(() => {
        if (!data.length || !selectedMetrics.length) return;

        const headers = getHeaders(selectedMetrics);
        const rows = data.map((item) => getRow(item, selectedMetrics));

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileNamePrefix}_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [data, selectedMetrics, fileNamePrefix, getHeaders, getRow]);

    const exportToExcel = useCallback(() => {
        if (!data.length || !selectedMetrics.length) return;

        const headers = getHeaders(selectedMetrics);
        const dataRows = data.map((item) => {
            const row = getRow(item, selectedMetrics);
            return headers.reduce((acc, header, index) => ({
                ...acc,
                [header]: row[index],
            }), {});
        });

        const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        XLSX.writeFile(workbook, `${fileNamePrefix}_${new Date().toISOString()}.xlsx`);
    }, [data, selectedMetrics, fileNamePrefix, getHeaders, getRow]);

    const handleDownload = useCallback(() => {
        if (downloadFormat === 'csv') {
            exportToCSV();
        } else {
            exportToExcel();
        }
        setIsDownloadDialogOpen(false);
    }, [downloadFormat, exportToCSV, exportToExcel]);

    const DownloadDialog: React.FC = () => (
        <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Download Data</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Select Format</label>
                        <Select
                            value={downloadFormat}
                            onValueChange={(value) => setDownloadFormat(value as 'csv' | 'excel')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="excel">Excel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsDownloadDialogOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleDownload} disabled={!data.length || !selectedMetrics.length}>
                        Download
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return {
        setIsDownloadDialogOpen,
        DownloadDialog,
    };
}