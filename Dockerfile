FROM python:3.11-slim

WORKDIR /app

# Installa dipendenze di sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements
COPY requirements.txt .

# Installa dipendenze Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia l'applicazione
COPY . .

# Esponi la porta
EXPOSE 8000

# Il comando è definito nel docker-compose.yml per il reload automatico
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
