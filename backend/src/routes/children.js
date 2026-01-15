import { Router } from 'express';
import db from '../db/database.js';
import { getGrantSummary } from '../services/grantCalculator.js';

const router = Router();

// GET /api/children - Hent alle børn
router.get('/', (req, res) => {
    try {
        const children = db.prepare(`
            SELECT c.*,
                   GROUP_CONCAT(cg.id) as caregiver_ids,
                   GROUP_CONCAT(cg.first_name || ' ' || cg.last_name) as caregiver_names
            FROM children c
            LEFT JOIN child_caregiver cc ON c.id = cc.child_id
            LEFT JOIN caregivers cg ON cc.caregiver_id = cg.id
            GROUP BY c.id
            ORDER BY c.last_name, c.first_name
        `).all();

        // Parse caregiver data
        const result = children.map(child => ({
            ...child,
            caregivers: child.caregiver_ids
                ? child.caregiver_ids.split(',').map((id, i) => ({
                    id: parseInt(id),
                    name: child.caregiver_names.split(',')[i]
                }))
                : [],
            grant_weekdays: child.grant_weekdays ? JSON.parse(child.grant_weekdays) : null
        }));

        res.json(result);
    } catch (error) {
        console.error('Fejl ved hentning af børn:', error);
        res.status(500).json({ error: 'Kunne ikke hente børn' });
    }
});

// GET /api/children/:id - Hent specifikt barn
router.get('/:id', (req, res) => {
    try {
        const child = db.prepare(`
            SELECT * FROM children WHERE id = ?
        `).get(req.params.id);

        if (!child) {
            return res.status(404).json({ error: 'Barn ikke fundet' });
        }

        // Hent tilknyttede barnepiger
        const caregivers = db.prepare(`
            SELECT cg.* FROM caregivers cg
            JOIN child_caregiver cc ON cg.id = cc.caregiver_id
            WHERE cc.child_id = ?
        `).all(req.params.id);

        // Hent bevillingsstatus
        const grantSummary = getGrantSummary(child.id);

        res.json({
            ...child,
            grant_weekdays: child.grant_weekdays ? JSON.parse(child.grant_weekdays) : null,
            caregivers,
            grantSummary
        });
    } catch (error) {
        console.error('Fejl ved hentning af barn:', error);
        res.status(500).json({ error: 'Kunne ikke hente barn' });
    }
});

// POST /api/children - Opret barn
router.post('/', (req, res) => {
    try {
        const {
            first_name,
            last_name,
            birth_date,
            psp_element,
            grant_type,
            grant_hours,
            grant_weekdays,
            has_frame_grant,
            frame_hours,
            caregiver_ids
        } = req.body;

        // Valider påkrævede felter
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'Fornavn og efternavn er påkrævet' });
        }

        const result = db.prepare(`
            INSERT INTO children (
                first_name, last_name, birth_date, psp_element,
                grant_type, grant_hours, grant_weekdays,
                has_frame_grant, frame_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            first_name,
            last_name,
            birth_date || null,
            psp_element || null,
            grant_type || 'week',
            grant_hours || 0,
            grant_weekdays ? JSON.stringify(grant_weekdays) : null,
            has_frame_grant ? 1 : 0,
            frame_hours || 0
        );

        const childId = result.lastInsertRowid;

        // Tilknyt barnepiger
        if (caregiver_ids && caregiver_ids.length > 0) {
            const insertCaregiver = db.prepare(`
                INSERT INTO child_caregiver (child_id, caregiver_id) VALUES (?, ?)
            `);

            for (const caregiverId of caregiver_ids) {
                insertCaregiver.run(childId, caregiverId);
            }
        }

        const newChild = db.prepare('SELECT * FROM children WHERE id = ?').get(childId);
        res.status(201).json({
            ...newChild,
            grant_weekdays: newChild.grant_weekdays ? JSON.parse(newChild.grant_weekdays) : null
        });
    } catch (error) {
        console.error('Fejl ved oprettelse af barn:', error);
        res.status(500).json({ error: 'Kunne ikke oprette barn' });
    }
});

// PUT /api/children/:id - Opdater barn
router.put('/:id', (req, res) => {
    try {
        const {
            first_name,
            last_name,
            birth_date,
            psp_element,
            grant_type,
            grant_hours,
            grant_weekdays,
            has_frame_grant,
            frame_hours,
            caregiver_ids
        } = req.body;

        // Tjek om barn eksisterer
        const existing = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Barn ikke fundet' });
        }

        db.prepare(`
            UPDATE children SET
                first_name = ?,
                last_name = ?,
                birth_date = ?,
                psp_element = ?,
                grant_type = ?,
                grant_hours = ?,
                grant_weekdays = ?,
                has_frame_grant = ?,
                frame_hours = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            first_name || existing.first_name,
            last_name || existing.last_name,
            birth_date !== undefined ? birth_date : existing.birth_date,
            psp_element !== undefined ? psp_element : existing.psp_element,
            grant_type || existing.grant_type,
            grant_hours !== undefined ? grant_hours : existing.grant_hours,
            grant_weekdays ? JSON.stringify(grant_weekdays) : existing.grant_weekdays,
            has_frame_grant !== undefined ? (has_frame_grant ? 1 : 0) : existing.has_frame_grant,
            frame_hours !== undefined ? frame_hours : existing.frame_hours,
            req.params.id
        );

        // Opdater barnepige-tilknytninger hvis angivet
        if (caregiver_ids !== undefined) {
            // Fjern eksisterende tilknytninger
            db.prepare('DELETE FROM child_caregiver WHERE child_id = ?').run(req.params.id);

            // Tilføj nye tilknytninger
            if (caregiver_ids && caregiver_ids.length > 0) {
                const insertCaregiver = db.prepare(`
                    INSERT INTO child_caregiver (child_id, caregiver_id) VALUES (?, ?)
                `);

                for (const caregiverId of caregiver_ids) {
                    insertCaregiver.run(req.params.id, caregiverId);
                }
            }
        }

        const updatedChild = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
        res.json({
            ...updatedChild,
            grant_weekdays: updatedChild.grant_weekdays ? JSON.parse(updatedChild.grant_weekdays) : null
        });
    } catch (error) {
        console.error('Fejl ved opdatering af barn:', error);
        res.status(500).json({ error: 'Kunne ikke opdatere barn' });
    }
});

// DELETE /api/children/:id - Slet barn
router.delete('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM children WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Barn ikke fundet' });
        }

        db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
        res.json({ message: 'Barn slettet' });
    } catch (error) {
        console.error('Fejl ved sletning af barn:', error);
        res.status(500).json({ error: 'Kunne ikke slette barn' });
    }
});

export default router;
