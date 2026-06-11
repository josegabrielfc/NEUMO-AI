import os
import sqlite3
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'neumo_ai.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

def get_db_connection():
    """Establish a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode for concurrent read/write
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    """Initialize the database schema if it doesn't exist."""
    print(f"Initializing database at {DB_PATH}...")
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")
        
    with open(SCHEMA_PATH, 'r') as f:
        schema_sql = f.read()
        
    conn = get_db_connection()
    try:
        conn.executescript(schema_sql)
        conn.commit()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise e
    finally:
        conn.close()

def save_diagnosis(nombres, apellidos, identificacion, edad, sexo, sintomas, descripcion, resultado, confianza, imagen_nombre):
    """Save a new diagnosis to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Serialize sintomas list to JSON string if it is a list
    if isinstance(sintomas, list):
        sintomas_str = json.dumps(sintomas)
    elif isinstance(sintomas, str):
        sintomas_str = sintomas
    else:
        sintomas_str = "[]"
        
    try:
        cursor.execute(
            """
            INSERT INTO diagnoses (nombres, apellidos, identificacion, edad, sexo, sintomas, descripcion, resultado, confianza, imagen_nombre)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (nombres, apellidos, identificacion, edad, sexo, sintomas_str, descripcion, resultado, confianza, imagen_nombre)
        )
        conn.commit()
        last_id = cursor.lastrowid
        return last_id
    except Exception as e:
        print(f"Error saving diagnosis: {e}")
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_diagnoses(limit=50, offset=0):
    """Retrieve list of diagnoses ordered by creation date desc."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM diagnoses ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        
        # Format rows to list of dicts
        diagnoses = []
        for row in rows:
            diag = dict(row)
            # Deserialize symptoms
            try:
                diag['sintomas'] = json.loads(diag['sintomas']) if diag['sintomas'] else []
            except Exception:
                diag['sintomas'] = []
            diagnoses.append(diag)
            
        # Get total count
        cursor.execute("SELECT COUNT(*) FROM diagnoses")
        total = cursor.fetchone()[0]
        
        return diagnoses, total
    except Exception as e:
        print(f"Error listing diagnoses: {e}")
        raise e
    finally:
        conn.close()

def get_diagnosis_by_id(diagnosis_id):
    """Retrieve a single diagnosis by its database ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diagnoses WHERE id = ?", (diagnosis_id,))
        row = cursor.fetchone()
        
        if row is None:
            return None
            
        diag = dict(row)
        try:
            diag['sintomas'] = json.loads(diag['sintomas']) if diag['sintomas'] else []
        except Exception:
            diag['sintomas'] = []
            
        return diag
    except Exception as e:
        print(f"Error fetching diagnosis {diagnosis_id}: {e}")
        raise e
    finally:
        conn.close()

def delete_diagnosis(diagnosis_id):
    """Delete a diagnosis by ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM diagnoses WHERE id = ?", (diagnosis_id,))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error deleting diagnosis {diagnosis_id}: {e}")
        conn.rollback()
        raise e
    finally:
        conn.close()
