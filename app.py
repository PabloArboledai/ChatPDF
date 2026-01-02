"""
ChatPDF - A chat interface for PDF documents with cloud agent delegation
"""
import os
import json
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Store pending changes that need confirmation
pending_changes = {}

def allowed_file(filename):
    """Check if file has allowed extension"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    """Render the main chat interface"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle PDF file upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'File uploaded successfully'
        })
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/confirm-changes', methods=['POST'])
def confirm_changes():
    """Confirm pending changes before applying them"""
    data = request.json
    change_id = data.get('change_id')
    action = data.get('action')  # 'confirm' or 'reject'
    
    if not change_id or not action:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    if change_id not in pending_changes:
        return jsonify({'error': 'Change not found'}), 404
    
    change = pending_changes[change_id]
    
    if action == 'confirm':
        # Apply the change
        result = {
            'success': True,
            'message': 'Changes confirmed and applied',
            'change': change
        }
        # Remove from pending after confirmation
        del pending_changes[change_id]
        return jsonify(result)
    
    elif action == 'reject':
        # Reject the change
        del pending_changes[change_id]
        return jsonify({
            'success': True,
            'message': 'Changes rejected'
        })
    
    return jsonify({'error': 'Invalid action'}), 400

@app.route('/api/delegate-to-cloud', methods=['POST'])
def delegate_to_cloud():
    """Delegate task to cloud agent"""
    data = request.json
    task = data.get('task')
    parameters = data.get('parameters', {})
    
    if not task:
        return jsonify({'error': 'No task specified'}), 400
    
    # Create a change ID for this delegation
    import uuid
    change_id = str(uuid.uuid4())
    
    # Store as pending change that requires confirmation
    pending_changes[change_id] = {
        'type': 'cloud_delegation',
        'task': task,
        'parameters': parameters,
        'status': 'pending_confirmation'
    }
    
    return jsonify({
        'success': True,
        'message': 'Task ready for delegation to cloud agent',
        'change_id': change_id,
        'task': task,
        'requires_confirmation': True
    })

@app.route('/api/pending-changes', methods=['GET'])
def get_pending_changes():
    """Get all pending changes awaiting confirmation"""
    return jsonify({
        'changes': [
            {'id': change_id, **change_data}
            for change_id, change_data in pending_changes.items()
        ]
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages"""
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    # Simple echo response for now
    response = {
        'success': True,
        'response': f'Received: {message}',
        'can_delegate': True
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
