CREATE TABLE IF NOT EXISTS diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    identificacion TEXT NOT NULL,
    edad INTEGER NOT NULL,
    sexo TEXT NOT NULL CHECK(sexo IN ('M', 'F')),
    sintomas TEXT,              -- JSON list of symptoms, e.g., '["fiebre", "tos"]'
    descripcion TEXT,
    resultado TEXT NOT NULL CHECK(resultado IN ('NORMAL', 'NEUMONÍA')),
    confianza REAL NOT NULL,    -- Percentage from 0.0 to 100.0
    imagen_nombre TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
