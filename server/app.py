import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# Import local modules
from database import init_db, save_diagnosis, get_diagnoses, get_diagnosis_by_id, delete_diagnosis
from model import load_model_and_constants, predict_pneumonia

app = Flask(__name__)
# Enable CORS for frontend running on Port 5173
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB limit (RF-01)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the uploaded file has a valid extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Initialize resources on startup
with app.app_context():
    try:
        init_db()
        load_model_and_constants()
    except Exception as e:
        print(f"Startup warning/error (model load or db init failed): {e}")

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Handle patient registration and X-ray prediction.
    Expects multipart/form-data with:
        - nombres (str)
        - apellidos (str)
        - identificacion (str)
        - edad (int)
        - sexo (str: M/F)
        - sintomas (JSON array as string)
        - descripcion (str)
        - image (file)
    """
    # 1. Validate request data
    if 'image' not in request.files:
        return jsonify({"error": "No se subió ninguna imagen"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No se seleccionó ningún archivo de imagen"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Formato de imagen no permitido. Use JPG, JPEG o PNG"}), 400

    # Extract form fields (RF-02)
    nombres = request.form.get('nombres', '').strip()
    apellidos = request.form.get('apellidos', '').strip()
    identificacion = request.form.get('identificacion', '').strip()
    edad_str = request.form.get('edad', '').strip()
    sexo = request.form.get('sexo', '').strip().upper()
    sintomas_raw = request.form.get('sintomas', '[]')
    descripcion = request.form.get('descripcion', '').strip()

    # Validate required patient fields (RF-02)
    if not all([nombres, apellidos, identificacion, edad_str, sexo]):
        return jsonify({"error": "Faltan campos obligatorios del paciente"}), 400
        
    try:
        edad = int(edad_str)
        if edad < 0 or edad > 150:
            raise ValueError()
    except ValueError:
        return jsonify({"error": "La edad debe ser un número entero válido"}), 400
        
    if sexo not in ['M', 'F']:
        return jsonify({"error": "El sexo debe ser M o F"}), 400

    # Parse symptoms list
    try:
        sintomas = json.loads(sintomas_raw)
        if not isinstance(sintomas, list):
            sintomas = []
    except Exception:
        sintomas = []

    # 2. Save and validate image file (RF-01)
    # Generate temporary filepath
    temp_filename = f"temp_{identificacion}_{file.filename}"
    temp_filepath = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
    
    try:
        file.save(temp_filepath)
        
        # Verify it's a valid image using PIL (RF-01 validation)
        try:
            with Image.open(temp_filepath) as img:
                img.verify()
        except Exception:
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
            return jsonify({"error": "El archivo cargado no es una imagen válida"}), 400
            
        # 3. Perform prediction (RF-03)
        resultado = predict_pneumonia(temp_filepath)
        
        # 4. Save to Database
        db_id = save_diagnosis(
            nombres=nombres,
            apellidos=apellidos,
            identificacion=identificacion,
            edad=edad,
            sexo=sexo,
            sintomas=sintomas,
            descripcion=descripcion,
            resultado=resultado,
            imagen_nombre=file.filename
        )
        
        # 5. Clean up temporary image (RNF-04 - security & storage cleanup)
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
            
        # Return success response
        return jsonify({
            "success": True,
            "id": db_id,
            "resultado": resultado,
            "nombres": nombres,
            "apellidos": apellidos,
            "identificacion": identificacion,
            "edad": edad,
            "sexo": sexo,
            "sintomas": sintomas,
            "descripcion": descripcion,
            "imagen_nombre": file.filename
        }), 201

    except Exception as e:
        # Cleanup file if exception occurs
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)
        print(f"Error handling /api/predict: {e}")
        return jsonify({"error": f"Error interno en el procesamiento: {str(e)}"}), 500

@app.route('/api/diagnoses', methods=['GET'])
def get_all_diagnoses():
    """Retrieve history of diagnoses with pagination."""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
            
        offset = (page - 1) * limit
        diagnoses, total = get_diagnoses(limit=limit, offset=offset)
        
        return jsonify({
            "diagnoses": diagnoses,
            "total": total,
            "page": page,
            "limit": limit
        }), 200
    except Exception as e:
        print(f"Error listing diagnoses: {e}")
        return jsonify({"error": "Error al recuperar el historial"}), 500

@app.route('/api/diagnoses/<int:diag_id>', methods=['GET'])
def get_single_diagnosis(diag_id):
    """Retrieve a single diagnosis record by its ID."""
    try:
        diag = get_diagnosis_by_id(diag_id)
        if diag is None:
            return jsonify({"error": "Diagnóstico no encontrado"}), 404
        return jsonify(diag), 200
    except Exception as e:
        print(f"Error fetching diagnosis {diag_id}: {e}")
        return jsonify({"error": "Error al recuperar el diagnóstico"}), 500

@app.route('/api/diagnoses/<int:diag_id>', methods=['DELETE'])
def delete_single_diagnosis(diag_id):
    """Delete a diagnosis from history."""
    try:
        deleted = delete_diagnosis(diag_id)
        if not deleted:
            return jsonify({"error": "Diagnóstico no encontrado o ya eliminado"}), 404
        return jsonify({"success": True, "message": "Diagnóstico eliminado"}), 200
    except Exception as e:
        print(f"Error deleting diagnosis {diag_id}: {e}")
        return jsonify({"error": "Error al eliminar el registro"}), 500

if __name__ == '__main__':
    # Flask runs on Port 5001 to avoid macOS AirPlay Receiver conflicts on port 5000
    app.run(host='0.0.0.0', port=5001, debug=True)
