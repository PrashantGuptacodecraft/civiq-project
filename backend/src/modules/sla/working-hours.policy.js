export const DEFAULT_INDIAN_WORKING_HOURS = {
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    workingDays: [1, 2, 3, 4, 5], // Monday - Friday
    timeZone: 'Asia/Kolkata', // IST (+05:30)
    holidays: [],
};
export const DEFAULT_24_7_CONFIG = {
    startHour: 0,
    startMinute: 0,
    endHour: 24,
    endMinute: 0,
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    timeZone: 'UTC',
    holidays: [],
};
/**
 * Extracts date-time components in a given IANA time zone.
 */
export function getZonedTimeComponents(date, timeZone = 'Asia/Kolkata') {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        weekday: 'short',
    });
    const parts = formatter.formatToParts(date);
    const partMap = {};
    for (const p of parts) {
        partMap[p.type] = p.value;
    }
    const year = parseInt(partMap['year'] || '1970', 10);
    const month = parseInt(partMap['month'] || '1', 10);
    const day = parseInt(partMap['day'] || '1', 10);
    const hour = parseInt(partMap['hour'] || '0', 10);
    const minute = parseInt(partMap['minute'] || '0', 10);
    const second = parseInt(partMap['second'] || '0', 10);
    const weekdayStr = (partMap['weekday'] || '').toLowerCase();
    const weekdayMap = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };
    const dayOfWeek = weekdayMap[weekdayStr] ?? 0;
    const mm = month < 10 ? `0${month}` : `${month}`;
    const dd = day < 10 ? `0${day}` : `${day}`;
    const dateString = `${year}-${mm}-${dd}`;
    return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        dayOfWeek,
        dateString,
    };
}
/**
 * Converts local date-time components in a given timeZone back to an exact UTC Date.
 */
export function createDateInTimeZone(components, timeZone = 'Asia/Kolkata') {
    const { year, month, day, hour, minute, second = 0 } = components;
    // Construct ISO string with assumed UTC then compute offset
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const zoned = getZonedTimeComponents(utcGuess, timeZone);
    const desiredUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const zonedAsUtcMs = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
    const offsetMs = zonedAsUtcMs - desiredUtcMs;
    return new Date(utcGuess.getTime() - offsetMs);
}
export class WorkingHoursPolicy {
    config;
    constructor(config = DEFAULT_INDIAN_WORKING_HOURS) {
        this.config = config;
    }
    getConfig() {
        return this.config;
    }
    /**
     * Check if a given moment is within active working hours.
     */
    isWorkingMoment(date) {
        const zoned = getZonedTimeComponents(date, this.config.timeZone);
        // 1. Check working day of week
        if (!this.config.workingDays.includes(zoned.dayOfWeek)) {
            return false;
        }
        // 2. Check holidays
        if (this.config.holidays && this.config.holidays.includes(zoned.dateString)) {
            return false;
        }
        // 3. Check working hours window
        const currentMins = zoned.hour * 60 + zoned.minute;
        const startMins = this.config.startHour * 60 + this.config.startMinute;
        const endMins = this.config.endHour * 60 + this.config.endMinute;
        return currentMins >= startMins && currentMins < endMins;
    }
    /**
     * Advances a timestamp to the start of the next valid working window if currently outside.
     */
    advanceToWorkingWindow(date) {
        let current = new Date(date.getTime());
        // Iterate up to 14 days to find the next active window
        for (let i = 0; i < 14; i++) {
            const zoned = getZonedTimeComponents(current, this.config.timeZone);
            const isWorkDay = this.config.workingDays.includes(zoned.dayOfWeek) &&
                !(this.config.holidays && this.config.holidays.includes(zoned.dateString));
            const currentMins = zoned.hour * 60 + zoned.minute;
            const startMins = this.config.startHour * 60 + this.config.startMinute;
            const endMins = this.config.endHour * 60 + this.config.endMinute;
            if (isWorkDay) {
                if (currentMins < startMins) {
                    // Before working hours today -> move to start of today
                    return createDateInTimeZone({
                        year: zoned.year,
                        month: zoned.month,
                        day: zoned.day,
                        hour: this.config.startHour,
                        minute: this.config.startMinute,
                    }, this.config.timeZone);
                }
                else if (currentMins < endMins) {
                    // Inside working hours -> return current time
                    return current;
                }
            }
            // After working hours or non-working day -> advance to start of next day
            const nextDayGuess = new Date(current.getTime() + 24 * 3600 * 1000);
            const nextZoned = getZonedTimeComponents(nextDayGuess, this.config.timeZone);
            current = createDateInTimeZone({
                year: nextZoned.year,
                month: nextZoned.month,
                day: nextZoned.day,
                hour: this.config.startHour,
                minute: this.config.startMinute,
            }, this.config.timeZone);
        }
        return current;
    }
    /**
     * Add active business hours to a date, respecting working days, working hours, and timezones.
     */
    addBusinessHours(startDate, hoursToAdd) {
        if (hoursToAdd <= 0)
            return new Date(startDate.getTime());
        let current = this.advanceToWorkingWindow(startDate);
        let remainingMinutes = Math.round(hoursToAdd * 60);
        const startMins = this.config.startHour * 60 + this.config.startMinute;
        const endMins = this.config.endHour * 60 + this.config.endMinute;
        const dailyWorkingMinutes = endMins - startMins;
        while (remainingMinutes > 0) {
            current = this.advanceToWorkingWindow(current);
            const zoned = getZonedTimeComponents(current, this.config.timeZone);
            const currentDayMins = zoned.hour * 60 + zoned.minute;
            const availableTodayMins = endMins - currentDayMins;
            if (remainingMinutes <= availableTodayMins) {
                // Due time falls within today's working window
                const targetDayMins = currentDayMins + remainingMinutes;
                const targetHour = Math.floor(targetDayMins / 60);
                const targetMinute = targetDayMins % 60;
                return createDateInTimeZone({
                    year: zoned.year,
                    month: zoned.month,
                    day: zoned.day,
                    hour: targetHour,
                    minute: targetMinute,
                    second: zoned.second,
                }, this.config.timeZone);
            }
            else {
                // Consume rest of today and advance to next working day
                remainingMinutes -= availableTodayMins;
                const nextDayGuess = new Date(current.getTime() + 24 * 3600 * 1000);
                const nextZoned = getZonedTimeComponents(nextDayGuess, this.config.timeZone);
                current = createDateInTimeZone({
                    year: nextZoned.year,
                    month: nextZoned.month,
                    day: nextZoned.day,
                    hour: this.config.startHour,
                    minute: this.config.startMinute,
                }, this.config.timeZone);
            }
        }
        return current;
    }
    /**
     * Compute business hours elapsed between two timestamps.
     */
    calculateBusinessElapsedHours(startDate, endDate) {
        if (endDate.getTime() <= startDate.getTime()) {
            return 0.0;
        }
        let current = this.advanceToWorkingWindow(startDate);
        if (current.getTime() >= endDate.getTime()) {
            return 0.0;
        }
        let elapsedMinutes = 0;
        const endMinsConfig = this.config.endHour * 60 + this.config.endMinute;
        while (current.getTime() < endDate.getTime()) {
            current = this.advanceToWorkingWindow(current);
            if (current.getTime() >= endDate.getTime())
                break;
            const zoned = getZonedTimeComponents(current, this.config.timeZone);
            const currentDayMins = zoned.hour * 60 + zoned.minute;
            // End of today's working window in UTC
            const endOfToday = createDateInTimeZone({
                year: zoned.year,
                month: zoned.month,
                day: zoned.day,
                hour: this.config.endHour,
                minute: this.config.endMinute,
            }, this.config.timeZone);
            if (endDate.getTime() <= endOfToday.getTime()) {
                // End date is within today's window
                const endZoned = getZonedTimeComponents(endDate, this.config.timeZone);
                const endDayMins = endZoned.hour * 60 + endZoned.minute;
                elapsedMinutes += Math.max(0, endDayMins - currentDayMins);
                break;
            }
            else {
                // Consume rest of today's window
                elapsedMinutes += Math.max(0, endMinsConfig - currentDayMins);
                // Move to start of tomorrow
                const tomorrow = new Date(current.getTime() + 24 * 3600 * 1000);
                const nextZoned = getZonedTimeComponents(tomorrow, this.config.timeZone);
                current = createDateInTimeZone({
                    year: nextZoned.year,
                    month: nextZoned.month,
                    day: nextZoned.day,
                    hour: this.config.startHour,
                    minute: this.config.startMinute,
                }, this.config.timeZone);
            }
        }
        return Number((elapsedMinutes / 60).toFixed(2));
    }
}
export const defaultWorkingHoursPolicy = new WorkingHoursPolicy();
