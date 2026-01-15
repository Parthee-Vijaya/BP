import { Router } from 'express';
import db from '../db/database.js';
import { calculateAllowances } from '../services/allowanceCalculator.js';
import { checkGrant } from '../services/grantCalculator.js';

const router = Router();

// GET /api/time-entries - Hent alle registreringer med filtrering
router.get('/', (req, res) => {
    try {
        const { status, child_id, caregiver_id, from_date, to_date } = req.query;

        let query = `
            SELECT te.*,
                   c.first_name as child_first_name,
                   c.last_name as child_last_name,
                   c.birth_date as child_birth_date,
                   cg.first_name as caregiver_first_name,
                   cg.last_name as caregiver_last_name,
                   cg.ma_number
            FROM time_entries te
            JOIN children c ON te.child_id = c.id
            JOIN caregivers cg ON te.caregiver_id = cg.id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ` AND te.status = ?`;
            params.push(status);
        }

        if (child_id) {
            query += ` AND te.child_id = ?`;
            params.push(child_id);
        }

        if (caregiver_id) {
            query += ` AND te.caregiver_id = ?`;
            params.push(caregiver_id);
        }

        if (from_date) {
            query += ` AND te.date >= ?`;
            params.push(from_date);
        }

        if (to_date) {
            query += ` AND te.date <= ?`;
            params.push(to_date);
        }

        // Sortering baseret på status
        if (status === 'pending') {
            query += ` ORDER BY te.submitted_at ASC`; // Ældste først
        } else {
            query += ` ORDER BY te.submitted_at DESC`; // Nyeste først
        }

        const entries = db.prepare(query).all(...params);
        res.json(entries);
    } catch (error) {
        console.error('Fejl ved hentning af registreringer:', error);
        res.status(500).json({ error: 'Kunne ikke hente registreringer' });
    }
});

// GET /api/time-entries/:id - Hent specifik registrering
router.get('/:id', (req, res) => {
    try {
        const entry = db.prepare(`
            SELECT te.*,
                   c.first_name as child_first_name,
                   c.last_name as child_last_name,
                   c.birth_date as child_birth_date,
                   cg.first_name as caregiver_first_name,
                   cg.last_name as caregiver_last_name,
                   cg.ma_number
            FROM time_entries te
            JOIN children c ON te.child_id = c.id
            JOIN caregivers cg ON te.caregiver_id = cg.id
            WHERE te.id = ?
        `).get(req.params.id);

        if (!entry) {
            return res.status(404).json({ error: 'Registrering ikke fundet' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Fejl ved hentning af registrering:', error);
        res.status(500).json({ error: 'Kunne ikke hente registrering' });
    }
});

// POST /api/time-entries - Opret ny registrering
router.post('/', (req, res) => {
    try {
        const { caregiver_id, child_id, date, start_time, end_time, comment } = req.body;

        // Valider påkrævede felter
        if (!caregiver_id || !child_id || !date || !start_time || !end_time) {
            return res.status(400).json({
                error: 'Barnepige, barn, dato, start- og sluttid er påkrævet'
            });
        }

        // Tjek at barnepige er tilknyttet barnet
        const connection = db.prepare(`
            SELECT * FROM child_caregiver
            WHERE child_id = ? AND caregiver_id = ?
        `).get(child_id, caregiver_id);

        if (!connection) {
            return res.status(400).json({
                error: 'Barnepigen er ikke tilknyttet dette barn'
            });
        }

        // Beregn tillæg
        const allowances = calculateAllowances(date, start_time, end_time);

        // Tjek bevilling
        const grantCheck = checkGrant(child_id, date, allowances.total_hours);

        // Opret registrering (tilladt selv ved overskridelse, men markeres)
        const result = db.prepare(`
            INSERT INTO time_entries (
                caregiver_id, child_id, date, start_time, end_time,
                normal_hours, evening_hours, night_hours,
                saturday_hours, sunday_holiday_hours, total_hours,
                comment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            caregiver_id,
            child_id,
            date,
            start_time,
            end_time,
            allowances.normal_hours,
            allowances.evening_hours,
            allowances.night_hours,
            allowances.saturday_hours,
            allowances.sunday_holiday_hours,
            allowances.total_hours,
            comment || null
        );

        const newEntry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            entry: newEntry,
            allowances,
            grantStatus: grantCheck
        });
    } catch (error) {
        console.error('Fejl ved oprettelse af registrering:', error);
        res.status(500).json({ error: 'Kunne ikke oprette registrering' });
    }
});

// POST /api/time-entries/preview - Preview beregning uden at gemme
router.post('/preview', (req, res) => {
    try {
        const { child_id, date, start_time, end_time } = req.body;

        if (!date || !start_time || !end_time) {
            return res.status(400).json({
                error: 'Dato, start- og sluttid er påkrævet'
            });
        }

        // Beregn tillæg
        const allowances = calculateAllowances(date, start_time, end_time);

        // Tjek bevilling hvis child_id er angivet
        let grantCheck = null;
        if (child_id) {
            grantCheck = checkGrant(child_id, date, allowances.total_hours);
        }

        res.json({
            allowances,
            grantStatus: grantCheck
        });
    } catch (error) {
        console.error('Fejl ved preview:', error);
        res.status(500).json({ error: 'Kunne ikke beregne preview' });
    }
});

// PUT /api/time-entries/:id/approve - Godkend registrering
router.put('/:id/approve', (req, res) => {
    try {
        const { reviewed_by } = req.body;

        const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Registrering ikke fundet' });
        }

        if (entry.status !== 'pending') {
            return res.status(400).json({
                error: 'Kun afventende registreringer kan godkendes'
            });
        }

        db.prepare(`
            UPDATE time_entries SET
                status = 'approved',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(reviewed_by || 'Admin', req.params.id);

        const updatedEntry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        res.json(updatedEntry);
    } catch (error) {
        console.error('Fejl ved godkendelse:', error);
        res.status(500).json({ error: 'Kunne ikke godkende registrering' });
    }
});

// PUT /api/time-entries/:id/reject - Afvis registrering
router.put('/:id/reject', (req, res) => {
    try {
        const { reviewed_by, rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({
                error: 'Årsag til afvisning er påkrævet'
            });
        }

        const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Registrering ikke fundet' });
        }

        if (entry.status !== 'pending') {
            return res.status(400).json({
                error: 'Kun afventende registreringer kan afvises'
            });
        }

        db.prepare(`
            UPDATE time_entries SET
                status = 'rejected',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                rejection_reason = ?
            WHERE id = ?
        `).run(reviewed_by || 'Admin', rejection_reason, req.params.id);

        const updatedEntry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        res.json(updatedEntry);
    } catch (error) {
        console.error('Fejl ved afvisning:', error);
        res.status(500).json({ error: 'Kunne ikke afvise registrering' });
    }
});

// PUT /api/time-entries/:id/payroll - Marker som registreret i lønsystem
router.put('/:id/payroll', (req, res) => {
    try {
        const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Registrering ikke fundet' });
        }

        if (entry.status !== 'approved') {
            return res.status(400).json({
                error: 'Kun godkendte registreringer kan markeres i lønsystem'
            });
        }

        db.prepare(`
            UPDATE time_entries SET
                payroll_registered = 1,
                payroll_date = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(req.params.id);

        const updatedEntry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id);
        res.json(updatedEntry);
    } catch (error) {
        console.error('Fejl ved lønsystem-registrering:', error);
        res.status(500).json({ error: 'Kunne ikke markere i lønsystem' });
    }
});

// POST /api/time-entries/batch-approve - Godkend flere på én gang
router.post('/batch-approve', (req, res) => {
    try {
        const { ids, reviewed_by } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Ingen registreringer valgt' });
        }

        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`
            UPDATE time_entries SET
                status = 'approved',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders}) AND status = 'pending'
        `).run(reviewed_by || 'Admin', ...ids);

        res.json({ message: `${ids.length} registreringer godkendt` });
    } catch (error) {
        console.error('Fejl ved batch-godkendelse:', error);
        res.status(500).json({ error: 'Kunne ikke godkende registreringer' });
    }
});

export default router;
