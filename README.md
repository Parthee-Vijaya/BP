# Barnepige Timeregistrering

Webbaseret system til registrering og godkendelse af timer for barnepiger.

## Quick Start

```bash
# Installer dependencies
npm install

# Start både backend og frontend
npm run dev

# Eller start separat:
npm run dev:backend   # Backend på http://localhost:3001
npm run dev:frontend  # Frontend på http://localhost:5173
```

## Demo Data

Kør seed script for at oprette demo data:

```bash
node backend/seed-demo.js
```

Dette opretter:
- 3 barnepiger (Maria, Sofie, Line)
- 4 børn med forskellige bevillingstyper
- Tilknytninger mellem børn og barnepiger
- Demo timeregistreringer

## Brugerroller

### Administrator
- Administrer børn og barnepiger
- Godkend/afvis timeregistreringer
- Se alle registreringer
- Eksporter til CSV

### Barnepige
- Se tilknyttede børn og bevillingsstatus
- Registrer timer med automatisk tillægsberegning
- Se egne registreringer og status

## Tillægsregler

### Hverdage (mandag-fredag)
| Tid | Kategori |
|-----|----------|
| 00:00-06:00 | Nattillæg |
| 06:01-17:00 | Normaltimer |
| 17:01-23:00 | Aftentillæg |
| 23:00-23:59 | Nattillæg |

### Lørdag
| Tid | Kategori |
|-----|----------|
| 00:00-06:00 | Nattillæg |
| 06:01-08:00 | Normaltimer |
| 08:01-23:59 | Lørdagstillæg |

### Søn- og helligdage
| Tid | Kategori |
|-----|----------|
| 00:00-23:59 | Søndags- og helligdagstillæg |

**Helligdage overruler andre dage!**

## Bevillingstyper

- **Uge**: Mandag til søndag
- **Måned**: 1. til sidste dag
- **Kvartal**: Q1-Q4
- **Halvår**: H1/H2
- **År**: Hele året
- **Specifikke ugedage**: Timer pr. valgt ugedag
- **Rammebevilling**: Årlig bevilling (overruler normal bevilling)

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite

## Projektstruktur

```
Barnepige/
├── frontend/           # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── admin/
│       │   └── caregiver/
│       └── utils/
├── backend/            # Express API
│   └── src/
│       ├── routes/
│       ├── services/
│       └── db/
├── package.json        # Root workspace
└── README.md
```

## API Endpoints

- `GET /api/children` - Alle børn
- `GET /api/caregivers` - Alle barnepiger
- `GET /api/time-entries` - Timeregistreringer (med filtre)
- `POST /api/time-entries` - Opret registrering
- `POST /api/time-entries/preview` - Preview beregning
- `PUT /api/time-entries/:id/approve` - Godkend
- `PUT /api/time-entries/:id/reject` - Afvis
- `GET /api/export/time-entries` - CSV export
