-- ========================================
-- INIT SCRIPT PER POSTGRESQL LOCALE
-- ========================================
-- Questo script viene eseguito automaticamente quando il container PostgreSQL viene avviato
-- Crea le tabelle necessarie per i log ad alta frequenza

-- Crea la tabella per i log dei device
CREATE TABLE IF NOT EXISTS device_logs (
    id SERIAL PRIMARY KEY,
    device_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indici per query veloci
    INDEX idx_device_logs_device_id (device_id),
    INDEX idx_device_logs_timestamp (timestamp DESC),
    INDEX idx_device_logs_event_type (event_type),
    INDEX idx_device_logs_data USING gin(data)
);

-- Crea la tabella per i log delle API
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms FLOAT,
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_logs_timestamp (timestamp DESC),
    INDEX idx_api_logs_user_id (user_id),
    INDEX idx_api_logs_status_code (status_code)
);

-- Crea la tabella per eventi di sistema
CREATE TABLE IF NOT EXISTS system_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- info, warning, error, critical
    message TEXT,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_system_events_timestamp (timestamp DESC),
    INDEX idx_system_events_severity (severity),
    INDEX idx_system_events_type (event_type)
);

-- Funzione per pulizia automatica dei log vecchi (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_logs(retention_days INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
    DELETE FROM device_logs WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM api_logs WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM system_events WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Log iniziale
INSERT INTO system_events (event_type, severity, message, metadata)
VALUES ('database_initialized', 'info', 'Local PostgreSQL database initialized successfully', '{"version": "16"}'::jsonb);

COMMENT ON TABLE device_logs IS 'Log ad alta frequenza per eventi dei dispositivi';
COMMENT ON TABLE api_logs IS 'Log delle chiamate API per monitoring e debugging';
COMMENT ON TABLE system_events IS 'Eventi di sistema e notifiche';
