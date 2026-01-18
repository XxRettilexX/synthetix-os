# 🌐 Configurazione Tailscale per Synthetix OS

## Obiettivo
Esporre il backend FastAPI sulla Tailnet in modo che sia accessibile da tutti i tuoi dispositivi connessi a Tailscale, mantenendo la sicurezza e la privacy della tua rete personale.

---

## 📋 Prerequisiti

1. **Tailscale installato** sul server Homelab
2. **Autenticato** nella tua Tailnet
3. **Docker e Docker Compose** installati

---

## 🚀 Setup Passo-Passo

### 1. Verifica l'IP Tailscale del Server

Sul server dove eseguirai Docker Compose:

```bash
# Ottieni l'IP Tailscale del server
tailscale ip -4
```

Output esempio: `100.64.0.5`

Copia questo IP e aggiornalo nel file `.env`:

```bash
TAILSCALE_IP=100.64.0.5
```

---

### 2. Configura FastAPI per Ascoltare su Tutti gli Indirizzi

FastAPI è già configurato nel `docker-compose.yml` per ascoltare su `0.0.0.0:8000`, che significa:
- ✅ Accessibile dall'interfaccia Tailscale
- ✅ Accessibile da localhost
- ✅ Accessibile dalla rete locale

**Nessuna modifica necessaria** se usi il docker-compose.yml fornito.

---

### 3. Verifica la Configurazione di Rete di Docker

Il container FastAPI deve essere accessibile dall'host. Verifica che le porte siano correttamente mappate:

```yaml
# In docker-compose.yml (già configurato)
services:
  fastapi:
    ports:
      - "8000:8000"  # Mappa la porta 8000 del container sulla porta 8000 dell'host
```

Questo permette di accedere all'API:
- Da localhost: `http://localhost:8000`
- Da Tailscale: `http://100.64.0.5:8000`
- Dalla rete locale: `http://192.168.x.x:8000`

---

### 4. Avvia i Container

```bash
cd "/home/vito/lab_data/Synthetix OS"

# Crea il file .env dalla template
cp .env.example .env

# Modifica il .env con i tuoi valori reali
nano .env

# Avvia i container
docker-compose up -d

# Verifica che i container siano in esecuzione
docker-compose ps

# Controlla i log
docker-compose logs -f fastapi
```

---

### 5. Testa la Connessione

#### Dal server locale:
```bash
curl http://localhost:8000/api/health
```

#### Da un dispositivo nella Tailnet:
```bash
# Sostituisci con il tuo IP Tailscale
curl http://100.64.0.5:8000/api/health
```

Dovresti ricevere:
```json
{
  "status": "healthy",
  "service": "Synthetix OS API",
  "version": "1.0.0"
}
```

---

## 🔒 Sicurezza e Best Practices

### 1. Firewall (Opzionale ma Consigliato)

Se hai un firewall attivo (es. `ufw`), permetti solo il traffico da Tailscale:

```bash
# Permetti il traffico dalla rete Tailscale (100.64.0.0/10)
sudo ufw allow from 100.64.0.0/10 to any port 8000

# Verifica le regole
sudo ufw status
```

### 2. Limitare l'Accesso CORS in Produzione

Nel file [app/main.py](app/main.py), aggiorna la configurazione CORS per produzione:

```python
# Sostituisci l'asterisco (*) con gli origin specifici
allow_origins=[
    "http://localhost:3000",
    "https://your-domain.vercel.app",
    f"http://{settings.TAILSCALE_IP}:3000",
    # Aggiungi altri origin autorizzati
],
```

### 3. Usa HTTPS con Tailscale (Opzionale)

Tailscale supporta certificati HTTPS automatici:

```bash
# Abilita HTTPS sul tuo nodo
tailscale cert your-server-name
```

Poi configura FastAPI per usare i certificati generati.

---

## 🧪 Test dalla Tailnet

### Da un altro dispositivo connesso a Tailscale:

1. **Dal browser:**
   - Vai a `http://100.64.0.5:8000/docs`
   - Dovresti vedere la documentazione interattiva di FastAPI

2. **Da codice (esempio Python):**
   ```python
   import requests
   
   response = requests.get("http://100.64.0.5:8000/api/health")
   print(response.json())
   ```

3. **Da un'app mobile:**
   - Assicurati che il dispositivo sia connesso alla Tailnet
   - Usa l'IP `http://100.64.0.5:8000` come base URL

---

## 🐛 Troubleshooting

### Problema: "Connection refused" dalla Tailnet

**Soluzione 1:** Verifica che Docker stia ascoltando su 0.0.0.0
```bash
docker-compose exec fastapi netstat -tlnp | grep 8000
```

Dovresti vedere: `0.0.0.0:8000`

**Soluzione 2:** Verifica che Tailscale sia attivo
```bash
tailscale status
```

**Soluzione 3:** Verifica il firewall
```bash
sudo ufw status
# Se necessario, aggiungi la regola per Tailscale
sudo ufw allow from 100.64.0.0/10
```

### Problema: CORS errors dal frontend

Assicurati che l'origin del frontend sia incluso in `allow_origins` in [app/main.py](app/main.py).

### Problema: "Can't connect to database"

Verifica che il container PostgreSQL sia in esecuzione:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

---

## 📱 Configurazione Client

### Web App (Next.js/React)
```javascript
// .env.local
NEXT_PUBLIC_API_URL=http://100.64.0.5:8000
```

### Mobile App
```dart
// Flutter/Dart
const String apiBaseUrl = 'http://100.64.0.5:8000';
```

### Desktop App (Electron/Tauri)
```javascript
// config.js
export const API_BASE_URL = 'http://100.64.0.5:8000';
```

---

## 🔄 Configurazione Avanzata: Magic DNS

Tailscale supporta Magic DNS per usare nomi invece di IP:

1. **Abilita Magic DNS** nella Tailscale Admin Console
2. **Assegna un hostname** al server (es: `homelab-server`)
3. **Usa il nome** invece dell'IP:
   ```
   http://homelab-server:8000
   ```

Questo rende la configurazione più robusta perché non dipende dall'IP.

---

## ✅ Checklist Finale

- [ ] Tailscale installato e autenticato sul server
- [ ] IP Tailscale ottenuto con `tailscale ip -4`
- [ ] File `.env` configurato con le credenziali corrette
- [ ] Docker Compose avviato: `docker-compose up -d`
- [ ] Healthcheck funzionante da localhost: `curl http://localhost:8000/api/health`
- [ ] Healthcheck funzionante dalla Tailnet: `curl http://<TAILSCALE_IP>:8000/api/health`
- [ ] CORS configurato per i tuoi frontend
- [ ] (Opzionale) Firewall configurato per permettere traffico Tailscale

---

## 📚 Risorse Utili

- [Tailscale Documentation](https://tailscale.com/kb/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Hai configurato correttamente Synthetix OS sulla tua Tailnet! 🎉**

Ora puoi accedere al tuo backend da qualsiasi dispositivo connesso alla tua rete Tailscale, ovunque tu sia.
