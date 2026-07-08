import { Period } from "../types.js";

export function formatTime(ms: number): string {
    const totalMin = Math.floor(ms / 60000);
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

export function isInPeriod(entryDate: Date, now: Date, period: Period): boolean {
    switch (period) {
        case 'D': return entryDate.toDateString() === now.toDateString();
        case 'W': {
            const day = now.getDay();
            const start = new Date(now);
            start.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
            start.setHours(0, 0, 0, 0);
            return entryDate >= start;
        }
        case 'M': return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        case 'Y': return entryDate.getFullYear() === now.getFullYear();
    }
}