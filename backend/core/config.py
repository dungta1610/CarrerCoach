# core/config.py

import google.generativeai as genai
from google.cloud import speech, vision, texttospeech
import json

# Khai báo hằng số cho key files
GOOGLE_SPEECH_KEY_FILE = "key/speech_key.json"
VISION_KEY = "key/ocr_key.json"
CHATBOT_KEY_FILE = "key/chatbot_key.json"

def load_gemini_api_key(key_file: str) -> str:
    """Load Gemini API key from JSON file."""
    try:
        with open(key_file, 'r') as f:
            key_data = json.load(f)
            # Check for common key names in the JSON structure
            if isinstance(key_data, dict):
                for key_name in ['GOOGLE_API_KEY', 'api_key', 'key', 'apiKey', 'API_KEY']:
                    if key_name in key_data:
                        return key_data[key_name]
                # Fallback: return the first value found
                return list(key_data.values())[0] if key_data else ""
            elif isinstance(key_data, str):
                return key_data
            else:
                raise ValueError(f"Unexpected key format in {key_file}")
    except FileNotFoundError:
        print(f"CRITICAL ERROR: Key file '{key_file}' not found.")
        raise
    except Exception as e:
        print(f"Error reading key file: {e}")
        raise

# Khởi tạo API Key
GOOGLE_API_KEY = load_gemini_api_key(CHATBOT_KEY_FILE)
genai.configure(api_key=GOOGLE_API_KEY)

# Cấu hình Gemini Model
generation_config = {"temperature": 0.7}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
GEMINI_MODEL = genai.GenerativeModel('gemini-2.5-flash-lite',
                             generation_config=generation_config,
                             safety_settings=safety_settings)