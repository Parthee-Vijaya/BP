-- Barnepige Timeregistrering Database Schema
-- SQLite database

-- Barnepiger (babysitters)
CREATE TABLE IF NOT EXISTS caregivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    ma_number TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Børn (children)
CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE,
    psp_element TEXT,

    -- Bevillingstype: 'week', 'month', 'quarter', 'half_year', 'year', 'specific_weekdays'
    grant_type TEXT NOT NULL DEFAULT 'week',

    -- Standard bevilling (timer) - bruges for alle typer undtagen specific_weekdays
    grant_hours REAL DEFAULT 0,

    -- Bevilling pr. ugedag (JSON) - kun for specific_weekdays
    -- Format: {"monday": 2, "tuesday": 4, "wednesday": 0, ...}
    grant_weekdays TEXT,

    -- Rammebevilling
    has_frame_grant INTEGER DEFAULT 0,
    frame_hours REAL DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relation: Barn <-> Barnepige (many-to-many)
CREATE TABLE IF NOT EXISTS child_caregiver (
    child_id INTEGER NOT NULL,
    caregiver_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (child_id, caregiver_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE
);

-- Timeregistreringer
CREATE TABLE IF NOT EXISTS time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caregiver_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,

    -- Dato og tid
    date DATE NOT NULL,
    start_time TEXT NOT NULL,  -- Format: "HH:MM"
    end_time TEXT NOT NULL,    -- Format: "HH:MM"

    -- Beregnede timer (opdateres automatisk)
    normal_hours REAL DEFAULT 0,
    evening_hours REAL DEFAULT 0,
    night_hours REAL DEFAULT 0,
    saturday_hours REAL DEFAULT 0,
    sunday_holiday_hours REAL DEFAULT 0,
    total_hours REAL DEFAULT 0,

    -- Kommentar
    comment TEXT,

    -- Status: 'pending', 'approved', 'rejected'
    status TEXT DEFAULT 'pending',

    -- Timestamps
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by TEXT,
    reviewed_at DATETIME,
    rejection_reason TEXT,

    -- Lønsystem registrering
    payroll_registered INTEGER DEFAULT 0,
    payroll_date DATETIME,

    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

-- Index for hurtigere søgning
CREATE INDEX IF NOT EXISTS idx_time_entries_child_id ON time_entries(child_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_caregiver_id ON time_entries(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
