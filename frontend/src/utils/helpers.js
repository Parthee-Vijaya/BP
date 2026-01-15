// Formater dato til dansk format
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formater dato og tid
export function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Oversæt status
export function translateStatus(status) {
    const translations = {
        pending: 'Afventer godkendelse',
        approved: 'Godkendt',
        rejected: 'Afvist'
    };
    return translations[status] || status;
}

// Oversæt bevillingstype
export function translateGrantType(type) {
    const translations = {
        week: 'Uge',
        month: 'Måned',
        quarter: 'Kvartal',
        half_year: 'Halvår',
        year: 'År',
        specific_weekdays: 'Specifikke ugedage'
    };
    return translations[type] || type;
}

// Oversæt ugedag
export function translateWeekday(weekday) {
    const translations = {
        monday: 'Mandag',
        tuesday: 'Tirsdag',
        wednesday: 'Onsdag',
        thursday: 'Torsdag',
        friday: 'Fredag',
        saturday: 'Lørdag',
        sunday: 'Søndag'
    };
    return translations[weekday] || weekday;
}

// Beregn bevillingsstatus (percentage)
export function calculateGrantPercentage(used, total) {
    if (total <= 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
}

// Få farve baseret på bevillingsstatus
export function getGrantStatusColor(percentage) {
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'yellow';
    return 'green';
}

// Formater timer (2 decimaler)
export function formatHours(hours) {
    return (hours || 0).toFixed(2);
}
