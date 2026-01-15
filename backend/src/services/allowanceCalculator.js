/**
 * Tillægsberegning for Barnepige Timeregistrering
 *
 * REGLER:
 *
 * HVERDAGE (mandag-fredag):
 * - 00:00-06:00: Nattillæg
 * - 06:01-17:00: Normaltimer
 * - 17:01-23:00: Aftentillæg
 * - 23:00-23:59: Nattillæg
 *
 * LØRDAGE:
 * - 00:00-06:00: Nattillæg
 * - 06:01-08:00: Normaltimer
 * - 08:01-23:59: Lørdagstillæg
 *
 * SØN- OG HELLIGDAGE:
 * - 00:00-23:59: Søndags- og helligdagstillæg
 *
 * OBS: Helligdage OVERRULER andre dage!
 */

// Danske helligdage (beregnes dynamisk)
function getDanishHolidays(year) {
    const holidays = [];

    // Faste helligdage
    holidays.push(`${year}-01-01`); // Nytårsdag
    holidays.push(`${year}-12-25`); // Juledag
    holidays.push(`${year}-12-26`); // 2. Juledag

    // Påskebaserede helligdage (beregnes ud fra påskedag)
    const easterDate = calculateEasterDate(year);

    // Skærtorsdag (3 dage før påske)
    holidays.push(addDays(easterDate, -3));
    // Langfredag (2 dage før påske)
    holidays.push(addDays(easterDate, -2));
    // Påskedag
    holidays.push(formatDate(easterDate));
    // 2. Påskedag (1 dag efter påske)
    holidays.push(addDays(easterDate, 1));
    // Store Bededag (26 dage efter påske) - BEMÆRK: Afskaffet fra 2024, men medtages for ældre data
    // holidays.push(addDays(easterDate, 26)); // Fjernet da den er afskaffet
    // Kristi Himmelfartsdag (39 dage efter påske)
    holidays.push(addDays(easterDate, 39));
    // Pinsedag (49 dage efter påske)
    holidays.push(addDays(easterDate, 49));
    // 2. Pinsedag (50 dage efter påske)
    holidays.push(addDays(easterDate, 50));

    return holidays;
}

// Beregn påskedag (Computus-algoritmen)
function calculateEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return formatDate(result);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Tjek om en dato er en helligdag
function isHoliday(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const holidays = getDanishHolidays(year);
    return holidays.includes(dateStr);
}

// Få ugedagsnummer (0 = søndag, 6 = lørdag)
function getDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    return date.getDay();
}

// Parse tid til minutter siden midnat
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Rund tid op til nærmeste kvarter
 * Eksempel: 12:07 -> 12:15, 13:47 -> 14:00, 12:00 -> 12:00
 * @param {string} timeStr - Tid i format HH:MM
 * @returns {string} - Afrundet tid i format HH:MM
 */
function roundUpToQuarter(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Hvis minutter allerede er 00, 15, 30 eller 45, returner uændret
    if (minutes % 15 === 0) {
        return timeStr;
    }

    // Rund op til nærmeste kvarter
    const roundedMinutes = Math.ceil(minutes / 15) * 15;

    if (roundedMinutes === 60) {
        // Næste time
        const newHours = (hours + 1) % 24;
        return `${String(newHours).padStart(2, '0')}:00`;
    }

    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

/**
 * Rund starttid op til nærmeste kvarter (start rundes op)
 * Rund sluttid op til nærmeste kvarter (slut rundes også op)
 * Eksempel: 12:07-13:47 -> 12:15-14:00 = 1 time 45 min
 */
function roundTimesToQuarters(startTime, endTime) {
    return {
        roundedStart: roundUpToQuarter(startTime),
        roundedEnd: roundUpToQuarter(endTime)
    };
}

// Beregn overlap mellem to tidsintervaller (i minutter)
function calculateOverlap(start1, end1, start2, end2) {
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Beregn tillæg for en registrering
 * @param {string} dateStr - Dato i format YYYY-MM-DD
 * @param {string} startTime - Starttid i format HH:MM
 * @param {string} endTime - Sluttid i format HH:MM
 * @returns {Object} - Beregnede timer fordelt på kategorier
 */
export function calculateAllowances(dateStr, startTime, endTime) {
    // Rund tider op til nærmeste kvarter
    const { roundedStart, roundedEnd } = roundTimesToQuarters(startTime, endTime);

    const startMinutes = timeToMinutes(roundedStart);
    let endMinutes = timeToMinutes(roundedEnd);

    // Håndter midnat-overgang (sluttid næste dag)
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // Tilføj 24 timer
    }

    const totalMinutes = endMinutes - startMinutes;
    const dayOfWeek = getDayOfWeek(dateStr);
    const holiday = isHoliday(dateStr);

    let result = {
        normal_hours: 0,
        evening_hours: 0,
        night_hours: 0,
        saturday_hours: 0,
        sunday_holiday_hours: 0,
        total_hours: 0
    };

    // Søndage (0) eller helligdage - ALT er søndagstillæg
    if (dayOfWeek === 0 || holiday) {
        result.sunday_holiday_hours = totalMinutes / 60;
        result.total_hours = totalMinutes / 60;
        return roundResult(result);
    }

    // Lørdage (6)
    if (dayOfWeek === 6) {
        // 00:00-06:00 (0-360): Nattillæg
        // 06:01-08:00 (361-480): Normaltimer
        // 08:01-23:59 (481-1439): Lørdagstillæg

        // Nattillæg: 00:00-06:00
        const nightMinutes1 = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 0, 360);

        // Normaltimer: 06:01-08:00
        const normalMinutes = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 361, 480);

        // Lørdagstillæg: 08:01-23:59
        const saturdayMinutes = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 481, 1440);

        // Nattillæg næste dag (hvis midnat-overgang)
        let nightMinutes2 = 0;
        if (endMinutes > 24 * 60) {
            // Timer efter midnat (på søndag = søndagstillæg)
            result.sunday_holiday_hours = (endMinutes - 24 * 60) / 60;
        }

        result.night_hours = nightMinutes1 / 60;
        result.normal_hours = normalMinutes / 60;
        result.saturday_hours = saturdayMinutes / 60;
        result.total_hours = (nightMinutes1 + normalMinutes + saturdayMinutes) / 60 + result.sunday_holiday_hours;

        return roundResult(result);
    }

    // Hverdage (mandag-fredag, 1-5)
    // 00:00-06:00 (0-360): Nattillæg
    // 06:01-17:00 (361-1020): Normaltimer
    // 17:01-23:00 (1021-1380): Aftentillæg
    // 23:00-23:59 (1380-1439): Nattillæg

    // Nattillæg morgen: 00:00-06:00
    const nightMorning = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 0, 360);

    // Normaltimer: 06:01-17:00
    const normalMinutes = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 361, 1020);

    // Aftentillæg: 17:01-23:00
    const eveningMinutes = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 1021, 1380);

    // Nattillæg aften: 23:00-23:59
    const nightEvening = calculateOverlap(startMinutes, Math.min(endMinutes, 24 * 60), 1380, 1440);

    // Timer efter midnat (næste dag) - afhænger af hvilken dag
    let nightAfterMidnight = 0;
    if (endMinutes > 24 * 60) {
        // Timer fra midnat til sluttid næste dag
        nightAfterMidnight = Math.min(endMinutes - 24 * 60, 360); // Max til kl 06:00
        // Resten efter 06:00 ville være normaltimer, men det håndteres som ny dag
    }

    result.night_hours = (nightMorning + nightEvening + nightAfterMidnight) / 60;
    result.normal_hours = normalMinutes / 60;
    result.evening_hours = eveningMinutes / 60;
    result.total_hours = (nightMorning + normalMinutes + eveningMinutes + nightEvening + nightAfterMidnight) / 60;

    return roundResult(result);
}

// Afrund alle værdier til 2 decimaler
function roundResult(result) {
    for (const key in result) {
        result[key] = Math.round(result[key] * 100) / 100;
    }
    return result;
}

// Eksporter helligdags-funktioner for test
export { getDanishHolidays, isHoliday };
