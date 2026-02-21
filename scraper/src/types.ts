export interface PrefectureConfig {
    id: string;
    name: string;
    department: string;
    region: string;
    tier: number;
    bookingUrl: string;
    alternateUrls?: string[];
    selectors?: {
        bookingButton?: string;
        availabilityIndicator?: string;
        noSlotIndicator?: string;
    };
    procedures: string[];
    checkInterval: number;
    active: boolean;
}

export interface ScrapeResult {
    slotsFound: number;
    checkedAt?: string;
    error?: string;
}
