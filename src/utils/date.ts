// src/utils/date.ts
export function formatDateTime(isoString: string): string {
    try {
        const date = new Date(isoString);

        if (isNaN(date.getTime())) {
            return "Invalid date";
        }

        // Use actual date from the timestamp
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

// Format for shorter time display
export function formatTimeShort(isoString: string): string {
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            return "";
        }
        // Format: 13:00
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch {
        return '';
    }
}

// Format for X-axis chart labels
export function formatChartLabel(dateTimeString: string): string {
    // If already formatted, extract just the time portion
    if (dateTimeString.includes(',')) {
        const parts = dateTimeString.split(',');
        if (parts.length > 1) {
            return parts[1].trim();
        }
        return dateTimeString;
    }

    // Otherwise try to parse as ISO string
    try {
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            return dateTimeString;
        }
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return dateTimeString;
    }
}