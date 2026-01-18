# Synthetix OS - Homelab Backend

**Sistema di gestione personal cloud e dispositivi per Homelab con sincronizzazione realtime e accesso sicuro tramite Tailscale.**

---

## 🎯 Giorno 1: Setup Infrastruttura Base

### Obiettivi Completati ✅

Oggi abbiamo costruito l'intera infrastruttura backend per Synthetix OS:

- **Docker Compose Multi-Service**: FastAPI + PostgreSQL + Redis orchestrati
- **FastAPI Boilerplate Professionale**: Struttura modulare con API REST complete
- **Integrazione Supabase**: Autenticazione e database cloud ready
- **Database Locale**: PostgreSQL per log ad alta frequenza
- **Schema SQL Completo**: Tabelle profiles, devices, files con Row Level Security
- **Configurazione Tailscale**: Accesso sicuro da tutta la Tailnet
- **Storage Condiviso**: Volume Docker per simulare cloud storage

### Architettura Implementata

```
┌─────────────────────────────────────────────────────────────┐
│                      TAILSCALE NETWORK                       │
│                    (100.115.76.42:8000)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   FastAPI Backend  │
                    │   (Port 8000)      │
                    │   + Supabase SDK   │
                    └────────┬───────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌─────▼──────┐   ┌─────▼─────┐
    │  PostgreSQL │   │   Redis    │   │  Supabase │
    │   (Local)   │   │  (Cache)   │   │  (Cloud)  │
    │  Log DB     │   │  State     │   │  Main DB  │
    └─────────────┘   └────────────┘   └───────────┘
```

### Stack Tecnologico

- **Backend**: FastAPI 0.109+ (Python 3.11)
- **Database Cloud**: Supabase (PostgreSQL + Auth + RLS)
- **Database Locale**: PostgreSQL 16 Alpine
- **Cache**: Redis 7 Alpine
- **Network**: Tailscale VPN Mesh
- **Container**: Docker Compose
- **Storage**: Volume Docker

---

## 🚀 Quick Start

### 1. Configura le Variabili d'Ambiente

```bash
# Copia il template
cp .env.example .env

# Modifica con i tuoi valori
nano .env
```

Compila con:
- `SUPABASE_URL` e `SUPABASE_KEY` (dal dashboard Supabase)
- `TAILSCALE_IP` (esegui `tailscale ip -4` sul server)

### 2. Configura Supabase

Vai su [Supabase Dashboard](https://app.supabase.com) → SQL Editor e esegui lo script:

```bash
supabase_schema.sql
```

Questo creerà le tabelle `profiles`, `devices`, e `files`.

### 3. Avvia l'Infrastruttura

```bash
# Avvia tutti i servizi
docker-compose up -d

# Verifica lo stato
docker-compose ps

# Controlla i log
docker-compose logs -f
```

### 4. Testa l'API

```bash
# Healthcheck locale
curl http://localhost:8000/api/health

# Healthcheck dettagliato
curl http://localhost:8000/api/health/detailed

# Documentazione interattiva
open http://localhost:8000/docs
```

### 5. Accesso da Tailnet

Segui la guida completa in [TAILSCALE_SETUP.md](TAILSCALE_SETUP.md).

---

## 📁 Struttura del Progetto

```
Synthetix OS/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point FastAPI
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py          # Configurazione app
│   ├── api/
│   │   ├── __init__.py
│   │   ├── healthcheck.py     # Endpoint di health
│   │   ├── devices.py         # API gestione dispositivi
│   │   └── files.py           # API gestione file
│   └── models/
│       ├── __init__.py
│       ├── device.py          # Schema Pydantic per device
│       └── file.py            # Schema Pydantic per file
├── docker-compose.yml          # Orchestrazione servizi
├── Dockerfile                  # Immagine FastAPI
├── requirements.txt            # Dipendenze Python
├── supabase_schema.sql        # Schema database Supabase
├── init_local_db.sql          # Schema database locale
├── .env.example               # Template variabili ambiente
└── TAILSCALE_SETUP.md         # Guida configurazione Tailscale
```

---

## 🐳 Servizi Docker

### FastAPI Backend
- **Porta:** 8000
- **Auto-reload:** Abilitato in development
- **Volume:** `./app` montato per hot-reload

### PostgreSQL (Locale)
- **Porta:** 5432
- **Database:** `synthetix_logs`
- **Uso:** Log ad alta frequenza
- **Persistenza:** Volume `postgres_data`

### Redis
- **Porta:** 6379
- **Uso:** Cache e stato realtime
- **Persistenza:** Volume `redis_data`

### Storage Condiviso
- **Path:** `./shared_storage`
- **Uso:** Simulazione cloud storage locale

---

## 🛠️ Comandi Utili

### Gestione Docker

```bash
# Avvia i servizi
docker-compose up -d

# Ferma i servizi
docker-compose down

# Rebuild dopo modifiche al Dockerfile
docker-compose up -d --build

# Vedi i log in realtime
docker-compose logs -f fastapi

# Accedi al container FastAPI
docker-compose exec fastapi bash

# Accedi al database PostgreSQL
docker-compose exec postgres psql -U synthetix -d synthetix_logs
```

### Sviluppo

```bash
# Installa dipendenze in locale (per IDE)
pip install -r requirements.txt

# Formatta il codice
black app/

# Linting
flake8 app/

# Test (TODO)
pytest
```

### Database

```bash
# Backup PostgreSQL locale
docker-compose exec postgres pg_dump -U synthetix synthetix_logs > backup.sql

# Ripristino
docker-compose exec -T postgres psql -U synthetix synthetix_logs < backup.sql

# Pulisci log vecchi (retention 30 giorni)
docker-compose exec postgres psql -U synthetix -d synthetix_logs -c "SELECT cleanup_old_logs(30);"
```

---

## 📡 API Endpoints

### Health
- `GET /api/health` - Healthcheck base
- `GET /api/health/detailed` - Healthcheck con stato servizi

### Devices
- `GET /api/devices` - Lista dispositivi
- `POST /api/devices` - Crea dispositivo
- `GET /api/devices/{id}` - Dettagli dispositivo
- `PATCH /api/devices/{id}` - Aggiorna dispositivo
- `DELETE /api/devices/{id}` - Elimina dispositivo

### Files
- `GET /api/files` - Lista file
- `POST /api/files/upload` - Upload file
- `GET /api/files/{id}` - Dettagli file
- `DELETE /api/files/{id}` - Elimina file

Documentazione completa: http://localhost:8000/docs

---

## 🔐 Sicurezza

### Row Level Security (Supabase)
Tutte le tabelle hanno RLS abilitato:
- Gli utenti vedono solo i propri dati
- Le policy impediscono accessi non autorizzati

### CORS
Configurato per permettere:
- Frontend in sviluppo (localhost:3000, localhost:5173)
- Deploy Vercel
- Dispositivi sulla Tailnet

### Variabili Sensibili
- Non committare mai il file `.env`
- Usa `.env.example` come template
- Ruota le chiavi API regolarmente

---

## 🧪 Testing

### Test Manuali

```bash
# Healthcheck
curl http://localhost:8000/api/health/detailed

# Crea un device (richiede autenticazione)
curl -X POST http://localhost:8000/api/devices \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Device", "device_type": "iot"}'

# Upload file
curl -X POST http://localhost:8000/api/files/upload \
  -F "file=@test.txt"
```

---

## 🚧 TODO / Roadmap

- [ ] Implementare autenticazione JWT con Supabase
- [ ] Middleware per logging richieste API
- [ ] WebSocket per updates realtime
- [ ] Upload file con chunking per file grandi
- [ ] Deduplicazione file basata su checksum
- [ ] Compressione automatica file
- [ ] Anteprima thumbnail per immagini
- [ ] Rate limiting
- [ ] Metrics con Prometheus
- [ ] Dashboard admin
- [ ] Test unitari e integrazione
- [ ] CI/CD pipeline

---

## 📝 Note di Sviluppo

### Architettura
- **Backend:** FastAPI (async, performante)
- **Database primario:** Supabase (PostgreSQL con RLS)
- **Database locale:** PostgreSQL (log ad alta frequenza)
- **Cache:** Redis (stato realtime, sessioni)
- **Storage:** Volume Docker (simulazione S3)
- **Network:** Tailscale (VPN mesh sicura)

### Perché Due Database?
- **Supabase:** Dati principali, auth, sincronizzazione cross-device
- **PostgreSQL locale:** Log ad alta frequenza che non necessitano cloud sync

---

## 📝 Log del Giorno 1

### Cosa Abbiamo Costruito

1. **Infrastructure as Code**
   - `docker-compose.yml`: Orchestrazione di 3 servizi (FastAPI, PostgreSQL, Redis)
   - `Dockerfile`: Immagine Python 3.11 ottimizzata
   - Volume per storage condiviso

2. **Backend FastAPI**
   - Struttura modulare: `app/api/`, `app/core/`, `app/models/`
   - Connessione a Supabase con `supabase-py`
   - CORS configurato per web e desktop app
   - Healthcheck dettagliato per monitoraggio

3. **API Endpoints Implementate**
   - Health: `/api/health`, `/api/health/detailed`
   - Devices: CRUD completo per gestione dispositivi
   - Files: Upload, download, gestione file cloud

4. **Database Schema**
   - Supabase: `profiles`, `devices`, `files` con RLS
   - PostgreSQL locale: `device_logs`, `api_logs`, `system_events`
   - Trigger automatici e funzioni utility

5. **Sicurezza**
   - Row Level Security su tutte le tabelle Supabase
   - CORS configurato
   - Variabili d'ambiente per credenziali sensibili

### Prossimi Passi (Giorno 2+)

- [ ] Implementare autenticazione JWT con Supabase Auth
- [ ] WebSocket per notifiche realtime
- [ ] Upload file con chunking per file grandi
- [ ] Dashboard di monitoring
- [ ] App mobile/desktop per test end-to-end

---

## 🆘 Supporto

### Problemi Comuni

**Container non si avvia:**
```bash
docker-compose logs fastapi
# Verifica le variabili d'ambiente in .env
```

**Errore connessione Supabase:**
- Verifica SUPABASE_URL e SUPABASE_KEY in `.env`
- Controlla che le tabelle esistano in Supabase

**Errore CORS:**
- Aggiorna `allow_origins` in `app/main.py`
- Verifica che l'origin del client sia corretto

---

## 📄 Licenza

Progetto personale per uso Homelab.

---

**Buon hacking! 🎉**
