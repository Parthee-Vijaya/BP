import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/caregivers - Hent alle barnepiger
router.get('/', (req, res) => {
    try {
        const caregivers = db.prepare(`
            SELECT cg.*,
                   GROUP_CONCAT(c.id) as child_ids,
                   GROUP_CONCAT(c.first_name || ' ' || c.last_name) as child_names
            FROM caregivers cg
            LEFT JOIN child_caregiver cc ON cg.id = cc.caregiver_id
            LEFT JOIN children c ON cc.child_id = c.id
            GROUP BY cg.id
            ORDER BY cg.last_name, cg.first_name
        `).all();

        // Parse child data
        const result = caregivers.map(caregiver => ({
            ...caregiver,
            children: caregiver.child_ids
                ? caregiver.child_ids.split(',').map((id, i) => ({
                    id: parseInt(id),
                    name: caregiver.child_names.split(',')[i]
                }))
                : []
        }));

        res.json(result);
    } catch (error) {
        console.error('Fejl ved hentning af barnepiger:', error);
        res.status(500).json({ error: 'Kunne ikke hente barnepiger' });
    }
});

// GET /api/caregivers/:id - Hent specifik barnepige
router.get('/:id', (req, res) => {
    try {
        const caregiver = db.prepare(`
            SELECT * FROM caregivers WHERE id = ?
        `).get(req.params.id);

        if (!caregiver) {
            return res.status(404).json({ error: 'Barnepige ikke fundet' });
        }

        // Hent tilknyttede børn
        const children = db.prepare(`
            SELECT c.* FROM children c
            JOIN child_caregiver cc ON c.id = cc.child_id
            WHERE cc.caregiver_id = ?
        `).all(req.params.id);

        res.json({
            ...caregiver,
            children
        });
    } catch (error) {
        console.error('Fejl ved hentning af barnepige:', error);
        res.status(500).json({ error: 'Kunne ikke hente barnepige' });
    }
});

// POST /api/caregivers - Opret barnepige
router.post('/', (req, res) => {
    try {
        const { first_name, last_name, ma_number, child_ids } = req.body;

        // Valider påkrævede felter
        if (!first_name || !last_name || !ma_number) {
            return res.status(400).json({
                error: 'Fornavn, efternavn og MA-nummer er påkrævet'
            });
        }

        // Tjek om MA-nummer allerede findes
        const existing = db.prepare(`
            SELECT id FROM caregivers WHERE ma_number = ?
        `).get(ma_number);

        if (existing) {
            return res.status(400).json({
                error: 'MA-nummer findes allerede'
            });
        }

        const result = db.prepare(`
            INSERT INTO caregivers (first_name, last_name, ma_number)
            VALUES (?, ?, ?)
        `).run(first_name, last_name, ma_number);

        const caregiverId = result.lastInsertRowid;

        // Tilknyt børn
        if (child_ids && child_ids.length > 0) {
            const insertChild = db.prepare(`
                INSERT INTO child_caregiver (child_id, caregiver_id) VALUES (?, ?)
            `);

            for (const childId of child_ids) {
                insertChild.run(childId, caregiverId);
            }
        }

        const newCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(caregiverId);
        res.status(201).json(newCaregiver);
    } catch (error) {
        console.error('Fejl ved oprettelse af barnepige:', error);
        res.status(500).json({ error: 'Kunne ikke oprette barnepige' });
    }
});

// PUT /api/caregivers/:id - Opdater barnepige
router.put('/:id', (req, res) => {
    try {
        const { first_name, last_name, ma_number, child_ids } = req.body;

        const existing = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Barnepige ikke fundet' });
        }

        // Tjek om nyt MA-nummer allerede bruges af anden
        if (ma_number && ma_number !== existing.ma_number) {
            const duplicate = db.prepare(`
                SELECT id FROM caregivers WHERE ma_number = ? AND id != ?
            `).get(ma_number, req.params.id);

            if (duplicate) {
                return res.status(400).json({
                    error: 'MA-nummer bruges allerede af en anden barnepige'
                });
            }
        }

        db.prepare(`
            UPDATE caregivers SET
                first_name = ?,
                last_name = ?,
                ma_number = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            first_name || existing.first_name,
            last_name || existing.last_name,
            ma_number || existing.ma_number,
            req.params.id
        );

        // Opdater børnetilknytninger hvis angivet
        if (child_ids !== undefined) {
            db.prepare('DELETE FROM child_caregiver WHERE caregiver_id = ?').run(req.params.id);

            if (child_ids && child_ids.length > 0) {
                const insertChild = db.prepare(`
                    INSERT INTO child_caregiver (child_id, caregiver_id) VALUES (?, ?)
                `);

                for (const childId of child_ids) {
                    insertChild.run(childId, req.params.id);
                }
            }
        }

        const updatedCaregiver = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
        res.json(updatedCaregiver);
    } catch (error) {
        console.error('Fejl ved opdatering af barnepige:', error);
        res.status(500).json({ error: 'Kunne ikke opdatere barnepige' });
    }
});

// DELETE /api/caregivers/:id - Slet barnepige
router.delete('/:id', (req, res) => {
    try {
        const existing = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Barnepige ikke fundet' });
        }

        db.prepare('DELETE FROM caregivers WHERE id = ?').run(req.params.id);
        res.json({ message: 'Barnepige slettet' });
    } catch (error) {
        console.error('Fejl ved sletning af barnepige:', error);
        res.status(500).json({ error: 'Kunne ikke slette barnepige' });
    }
});

export default router;
