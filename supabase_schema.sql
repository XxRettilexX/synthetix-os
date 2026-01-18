-- ========================================
-- SYNTHETIX OS - SUPABASE SCHEMA
-- ========================================
-- Esegui questo script nell'Editor SQL di Supabase
-- Dashboard > SQL Editor > New Query

-- ========================================
-- 1. TABELLA PROFILES
-- ========================================
-- Estende la tabella auth.users di Supabase con informazioni aggiuntive

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- Impostazioni utente
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono leggere solo il proprio profilo
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Gli utenti possono aggiornare solo il proprio profilo
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy: Gli utenti possono inserire solo il proprio profilo
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Funzione per creare automaticamente un profilo quando un utente si registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per creare il profilo automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ========================================
-- 2. TABELLA DEVICES
-- ========================================
-- Gestisce i dispositivi connessi all'account utente

CREATE TABLE IF NOT EXISTS public.devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informazioni device
    name TEXT NOT NULL,
    device_type TEXT,  -- es: 'smartphone', 'desktop', 'tablet', 'iot'
    
    -- Stato del device (struttura flessibile)
    state JSONB DEFAULT '{}'::jsonb,
    
    -- Tracking
    last_seen TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON public.devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_devices_state ON public.devices USING gin(state);

-- Abilita Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo i propri device
CREATE POLICY "Users can view own devices"
    ON public.devices
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire device per se stessi
CREATE POLICY "Users can insert own devices"
    ON public.devices
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare i propri device
CREATE POLICY "Users can update own devices"
    ON public.devices
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare i propri device
CREATE POLICY "Users can delete own devices"
    ON public.devices
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger per updated_at
CREATE TRIGGER set_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ========================================
-- 3. TABELLA FILES
-- ========================================
-- Catalogo dei file nel personal cloud

CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informazioni file
    name TEXT NOT NULL,
    path TEXT NOT NULL,  -- Path virtuale (es: /Documents/myfile.pdf)
    size BIGINT NOT NULL,  -- Dimensione in bytes
    mime_type TEXT,
    
    -- Storage
    storage_path TEXT NOT NULL,  -- Path fisico nel sistema di storage
    checksum TEXT,  -- SHA256 hash per deduplicazione
    
    -- Metadata
    tags TEXT[],  -- Array di tag per categorizzazione
    metadata JSONB DEFAULT '{}'::jsonb,  -- Metadata aggiuntivi (es: EXIF per immagini)
    
    -- Sharing (opzionale)
    is_public BOOLEAN DEFAULT false,
    shared_with UUID[],  -- Array di user_id con cui è condiviso
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON public.files(user_id, path);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON public.files(checksum);
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_files_metadata ON public.files USING gin(metadata);

-- Constraint: Un utente non può avere due file con lo stesso path
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_user_path_unique 
    ON public.files(user_id, path);

-- Abilita Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere i propri file e quelli condivisi con loro
CREATE POLICY "Users can view own and shared files"
    ON public.files
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR auth.uid() = ANY(shared_with)
        OR is_public = true
    );

-- Policy: Gli utenti possono inserire file per se stessi
CREATE POLICY "Users can insert own files"
    ON public.files
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare i propri file
CREATE POLICY "Users can update own files"
    ON public.files
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare i propri file
CREATE POLICY "Users can delete own files"
    ON public.files
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger per updated_at
CREATE TRIGGER set_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ========================================
-- 4. FUNZIONI UTILI
-- ========================================

-- Funzione per ottenere lo spazio totale usato da un utente
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(size), 0)
        FROM public.files
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per cercare file duplicati (stesso checksum)
CREATE OR REPLACE FUNCTION public.find_duplicate_files(user_uuid UUID)
RETURNS TABLE(checksum TEXT, file_count BIGINT, total_size BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.checksum,
        COUNT(*)::BIGINT as file_count,
        SUM(f.size)::BIGINT as total_size
    FROM public.files f
    WHERE f.user_id = user_uuid 
        AND f.checksum IS NOT NULL
    GROUP BY f.checksum
    HAVING COUNT(*) > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================
-- 5. INSERIMENTO DATI DI TEST (OPZIONALE)
-- ========================================
-- Decommenta per inserire dati di test dopo aver creato un utente

/*
-- Assicurati di sostituire 'your-user-id' con un ID utente reale
INSERT INTO public.devices (user_id, name, device_type, state, last_seen) VALUES
    ('your-user-id', 'iPhone 15', 'smartphone', '{"battery": 85, "online": true}'::jsonb, now()),
    ('your-user-id', 'MacBook Pro', 'desktop', '{"online": true, "ip": "192.168.1.100"}'::jsonb, now()),
    ('your-user-id', 'Raspberry Pi', 'iot', '{"temperature": 45, "uptime": 1234567}'::jsonb, now());

INSERT INTO public.files (user_id, name, path, size, mime_type, storage_path, checksum) VALUES
    ('your-user-id', 'welcome.txt', '/welcome.txt', 1024, 'text/plain', '/storage/user-id/abc123_welcome.txt', 'abc123hash'),
    ('your-user-id', 'photo.jpg', '/Photos/photo.jpg', 2048000, 'image/jpeg', '/storage/user-id/def456_photo.jpg', 'def456hash');
*/

-- ========================================
-- FINE SCHEMA
-- ========================================

-- Verifica che tutto sia stato creato correttamente
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'devices', 'files')
ORDER BY tablename;
