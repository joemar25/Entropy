'use client'

import { useState } from 'react'
import { Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge'

interface FilterToolbarProps {
    timeFilter: string
    setTimeFilter: (value: string) => void
    timeFilters: Array<{ value: string; label: string }>
    availableMetrics: Array<{ value: string; label: string }>
    selectedMetrics: string[]
    onMetricToggle: (metric: string) => void
}

export const FilterToolbar = ({
    timeFilter,
    setTimeFilter,
    timeFilters,
    availableMetrics,
    selectedMetrics,
    onMetricToggle
}: FilterToolbarProps) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-background shadow-sm">
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Filters</span>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                {/* Time Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Time Range:</span>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeFilters.map(filter => (
                                <SelectItem key={filter.value} value={filter.value}>
                                    {filter.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Metrics Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Metrics:</span>
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <span>{selectedMetrics.length} Selected</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[220px]">
                            <DropdownMenuLabel>Air Quality Metrics</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableMetrics.map(metric => (
                                <DropdownMenuCheckboxItem
                                    key={metric.value}
                                    checked={selectedMetrics.includes(metric.value)}
                                    onCheckedChange={() => onMetricToggle(metric.value)}
                                >
                                    {metric.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Active Filters Display */}
            {selectedMetrics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 ml-0 sm:ml-auto">
                    {selectedMetrics.map(metric => {
                        const metricLabel = availableMetrics.find(m => m.value === metric)?.label || metric;
                        return (
                            <Badge key={metric} variant="secondary" className="py-1">
                                {metricLabel}
                                <button
                                    className="ml-1 text-xs hover:text-destructive"
                                    onClick={() => onMetricToggle(metric)}
                                >
                                    ×
                                </button>
                            </Badge>
                        );
                    })}
                </div>
            )}
        </div>
    )
}