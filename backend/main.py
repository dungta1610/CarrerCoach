import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response
from google.cloud import speech
from google.cloud import vision
from google.cloud import texttospeech
import json
import re  
from fastapi.concurrency import run_in_threadpool 
from fastapi.middleware.cors import CORSMiddleware
import base64

# Key file paths
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

GOOGLE_API_KEY = load_gemini_api_key(CHATBOT_KEY_FILE)
genai.configure(api_key=GOOGLE_API_KEY)

async def transcribe_audio(audio_content: bytes) -> str:
    """
    Uses Google Cloud Speech-to-Text to convert audio bytes to text using the service account key.
    """
    try:
        client = speech.SpeechAsyncClient.from_service_account_file(
            GOOGLE_SPEECH_KEY_FILE
        )

        audio = speech.RecognitionAudio(content=audio_content)
        
        print(f"Audio content size: {len(audio_content)} bytes")
        
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            language_code="en-US",
            enable_automatic_punctuation=True,
            use_enhanced=True,
            model="default",
        )

        print("Sending audio to Google Speech-to-Text...")

        response = await client.recognize(config=config, audio=audio)
        
        print(f"Response received: {len(response.results)} results")
        
        if not response.results:
            return "(Error: No speech detected in audio)"
        
        transcript = " ".join(
            result.alternatives[0].transcript 
            for result in response.results 
            if result.alternatives
        )
        
        if not transcript or not transcript.strip():
            return "(Error: No speech could be recognized)"
            
        print(f"Transcript: {transcript}")
        return transcript.strip()

    except FileNotFoundError:
        print(f"CRITICAL ERROR: Key file '{GOOGLE_SPEECH_KEY_FILE}' not found.")
        return "(Server Error: STT key file not found)"
    except Exception as e:
        print(f"Speech-to-Text Error: {type(e).__name__}: {e}")
        return f"(Error processing audio: {e})"

# Gemini Configuration
generation_config = {"temperature": 0.7}
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
model = genai.GenerativeModel('gemini-2.5-flash-lite',
                             generation_config=generation_config,
                             safety_settings=safety_settings)

def ocr_cv_file_sync(content: bytes, mime_type: str) -> str:
    """
    Uses Google Cloud Vision (Synchronous) to OCR files (PDF/Images)
    by selecting the correct API method based on MIME_TYPE.
    """
    try:
        client = vision.ImageAnnotatorClient.from_service_account_file(VISION_KEY)
        
        print(f"Processing file ({mime_type}) with Google Vision (Sync)...")
        
        # Handle Documents (PDF, TIFF, DOCX)
        if mime_type in ["application/pdf", "image/tiff", "image/gif", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            print("Using PDF/TIFF/DOCX logic...")
            # Treat DOCX as PDF for Vision API input config
            actual_mime = "application/pdf" if "wordprocessingml" in mime_type else mime_type
            
            input_config = vision.InputConfig(content=content, mime_type=actual_mime)
            features = [vision.Feature(type_=vision.Feature.Type.DOCUMENT_TEXT_DETECTION)]
            file_request = vision.AnnotateFileRequest(input_config=input_config, features=features)
            batch_request = vision.BatchAnnotateFilesRequest(requests=[file_request])
            
            response = client.batch_annotate_files(request=batch_request)
            
            file_response = response.responses[0]
            page_response = file_response.responses[0] # Get the first page
            
            if page_response.error.message:
                raise Exception(f"Vision API Error (PDF/DOCX): {page_response.error.message}")
            
            if page_response.full_text_annotation:
                return page_response.full_text_annotation.text
            else:
                return "No text found in file."

        # Handle Images (PNG, JPG)
        elif mime_type in ["image/png", "image/jpeg"]:
            print("Using Image logic (PNG/JPG)...")
            image = vision.Image(content=content)
            
            response = client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Vision API Error (Image): {response.error.message}")
            
            if response.full_text_annotation:
                return response.full_text_annotation.text
            else:
                return "No text found in image."
        
        else:
            return f"(OCR Error: Unsupported MIME type '{mime_type}'. Supported: PDF, PNG, JPG, GIF, TIFF, DOCX.)"

    except FileNotFoundError:
        print(f"CRITICAL ERROR: Key file '{VISION_KEY}' not found.")
        return f"(Server Error: OCR key file not found.)"
    except Exception as e:
        print(f"OCR Error: {e}")
        return f"(Error processing OCR: {e})"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    prompt: str

class CVAnalysisRequest(BaseModel):
    cv_text: str
    role: str = ""
    organization: str = ""

class CVGenerationRequest(BaseModel):
    role: str
    skills: list[str]
    experience: str
    education: str
    achievements: list[str] = []

async def get_gemini_evaluation(user_answer: str):
    """
    Contains the logic to call Gemini.
    Receives text (typed or from STT) and returns JSON.
    """
    prompt_template = f"""You are an expert interview coach named CareerCoach.
Analyze the user's input and return ONLY a valid JSON object (no markdown, no extra text).

If the input is clearly an interview answer:
Return this exact format:
{{
  "type": "evaluation",
  "feedback": "Detailed feedback on strengths and weaknesses, with specific suggestions for improvement.",
  "suggested_answer": "A better example answer to this question."
}}

Otherwise:
Return this format:
{{
  "type": "general_answer",
  "response": "Your response to the user's input."
}}

User input:
{user_answer}

Respond with ONLY the JSON object, no other text."""
    
    try:
        response = await model.generate_content_async(prompt_template)
        raw_text = response.text.strip()
        
        print(f"Raw Gemini response: {raw_text[:200]}...")
        
        # Cleanup Markdown and code blocks
        raw_text = re.sub(r'```json\s*', '', raw_text)
        raw_text = re.sub(r'```\s*', '', raw_text)
        raw_text = raw_text.strip()
        
        # Try to find JSON object
        match = re.search(r'(\{[\s\S]*\})', raw_text)
        if match:
            json_str = match.group(1)
            print(f"Extracted JSON: {json_str[:200]}...")
            
            # Fix trailing commas before closing brackets
            json_str = re.sub(r',\s*([\]\}])', r'\1', json_str)
            
            # Try to parse JSON
            ai_data = json.loads(json_str)
            print(f"Successfully parsed: {ai_data.get('type')}")
            return JSONResponse(content=ai_data)
        else:
            print(f"No JSON found in response")
            return JSONResponse(
                content={
                    "type": "general_answer",
                    "response": raw_text[:500] if raw_text else "Please provide a clearer input."
                }
            )
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Problematic string: {raw_text}")
        return JSONResponse(
            content={
                "type": "evaluation",
                "feedback": "Your answer shows good effort. Keep practicing and try to be more specific with examples.",
                "suggested_answer": "Provide a more structured answer with specific examples from your experience."
            }
        )
    except Exception as e:
        print(f"Error calling Gemini: {type(e).__name__}: {e}")
        return JSONResponse(
            content={
                "type": "evaluation",
                "feedback": "I'm processing your response. Please try again in a moment.",
                "suggested_answer": "Consider adding more specific details to your answer."
            }
        )

@app.post("/api/gemini")
async def handle_gemini_request(data: UserInput):
    return await get_gemini_evaluation(data.prompt)

@app.post("/api/process-voice")
async def handle_voice_request(audio: UploadFile = File(...)):
    print(f"===== VOICE PROCESSING START =====")
    print(f"Received audio file: {audio.filename}")
    print(f"Content type: {audio.content_type}")
    
    try:
        audio_content = await audio.read()
        print(f"Audio size: {len(audio_content)} bytes")
        
        if len(audio_content) < 1000:
            return JSONResponse(
                status_code=400,
                content={"error": "Audio file too short", "transcription": ""}
            )
        
        transcribed_text = await transcribe_audio(audio_content)
        
        if "(Error" in transcribed_text or "(Server Error" in transcribed_text:
            print(f"Transcription error: {transcribed_text}")
            return JSONResponse(
                status_code=500,
                content={"error": transcribed_text, "transcription": ""}
            )
        
        print(f"Successfully transcribed: {transcribed_text}")
        print(f"===== VOICE PROCESSING END =====")
        return JSONResponse(content={"transcription": transcribed_text})
    except Exception as e:
        print(f"Voice processing exception: {type(e).__name__}: {e}")
        print(f"===== VOICE PROCESSING ERROR =====")
        return JSONResponse(
            status_code=500,
            content={"error": str(e), "transcription": ""}
        )

class TextToSpeechRequest(BaseModel):
    text: str

@app.post("/api/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to natural speech using Google Cloud Text-to-Speech.
    Returns base64 encoded audio.
    """
    try:
        client = texttospeech.TextToSpeechAsyncClient.from_service_account_file(
            GOOGLE_SPEECH_KEY_FILE
        )

        synthesis_input = texttospeech.SynthesisInput(text=request.text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Neural2-F",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=0.95,
            pitch=0.0
        )
        
        response = await client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        
        return JSONResponse(content={
            "audio": audio_base64,
            "format": "mp3"
        })
        
    except Exception as e:
        print(f"Text-to-Speech Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to synthesize speech: {str(e)}"}
        )

@app.post("/api/upload-cv")
async def handle_image_request(file: UploadFile = File(...)):
    content = await file.read()
    mime_type = file.content_type
    cv_text = await run_in_threadpool(ocr_cv_file_sync, content, mime_type)
    
    if "(Error" in cv_text or "(Server Error" in cv_text:
        return JSONResponse(status_code=500, content={"error": cv_text})
    return JSONResponse(content={"cv_text": cv_text})

@app.post("/api/analyze-cv")
async def analyze_cv(data: CVAnalysisRequest):
    """
    Analyze CV text and extract: role, skills, experience, pros/cons, learning path
    """
    prompt_template = f"""
    Bạn là chuyên gia hướng dẫn nghề nghiệp và phân tích sơ yếu lý lịch.
    
    Phân tích văn bản sơ yếu lý lịch sau và trích xuất các thông tin chi tiết toàn diện:
    
    Văn bản CV:
    {data.cv_text}
    
    VAI TRÒ MỤC TIÊU (nếu có): {data.role or 'Không xác định'}
    TỔ CHỨC MỤC TIÊU (nếu có): {data.organization or 'Không xác định'}
    
    Cung cấp phân tích chi tiết theo định dạng JSON với cấu trúc sau:
    {{
      "extracted_role": "Vai trò/vị trí chính dựa trên CV (ví dụ: 'Kỹ sư phần mềm', 'Quản lý tiếp thị')",
      "skills": ["kỹ năng1", "kỹ năng2", "kỹ năng3", ...],
      "experience_years": "Số năm kinh nghiệm ước tính",
      "experience_summary": "Tóm tắt ngắn gọn về kinh nghiệm làm việc",
      "education": "Nền tảng giáo dục",
      "strengths": ["điểm mạnh1", "điểm mạnh2", ...],
      "weaknesses": ["điểm yếu1", "điểm yếu2", ...],
      "learning_path": {{
        "immediate": ["kỹ năng hoặc lĩnh vực cần học ngay lập tức"],
        "short_term": ["kỹ năng cho 3-6 tháng tới"],
        "long_term": ["kỹ năng cho 6-12 tháng"]
      }},
      "recommended_tasks": ["nhiệm vụ 1", "nhiệm vụ 2", ...]
    }}
    
    Chỉ trả về đối tượng JSON, không có văn bản bổ sung.
    """
    
    try:
        response = await model.generate_content_async(prompt_template)
        raw_text = response.text.strip()
        
        match = re.search(r'```json\s*({.*?})\s*```|({.*?})', raw_text, re.DOTALL)
        if match:
            json_str = match.group(1) or match.group(2)
            analysis_data = json.loads(json_str)
            return JSONResponse(content=analysis_data)
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "Could not parse AI response", "raw": raw_text}
            )
    except Exception as e:
        print(f"Error in CV analysis: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/generate-cv")
async def generate_cv(data: CVGenerationRequest):
    """
    Generate a sample CV in markdown format based on user profile
    """
    skills_list = ", ".join(data.skills)
    achievements_list = "\n".join([f"- {a}" for a in data.achievements]) if data.achievements else "- [Add your achievements]"
    
    prompt_template = f"""
    You are an expert CV/resume writer.
    
    Create a professional CV in Markdown format for a candidate with the following profile:
    
    ROLE: {data.role}
    SKILLS: {skills_list}
    EXPERIENCE: {data.experience}
    EDUCATION: {data.education}
    ACHIEVEMENTS:
    {achievements_list}
    
    Generate a complete, professional CV in Markdown format with the following sections:
    - Header with name and contact (use placeholders)
    - Professional Summary
    - Skills
    - Work Experience
    - Education
    - Achievements
    - Additional relevant sections
    
    Make it ATS-friendly and professional. Use proper Markdown formatting.
    Return ONLY the Markdown content, no JSON, no code blocks.
    """
    
    try:
        response = await model.generate_content_async(prompt_template)
        cv_markdown = response.text.strip()
        
        # Remove markdown code blocks if present
        cv_markdown = re.sub(r'^```markdown\s*', '', cv_markdown)
        cv_markdown = re.sub(r'```\s*$', '', cv_markdown)
        
        return JSONResponse(content={"cv_markdown": cv_markdown})
    except Exception as e:
        print(f"Error in CV generation: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

class QuestionGenerationRequest(BaseModel):
    field: str
    role: str = ""
    skills: list[str] = []

@app.post("/api/generate-questions")
async def generate_questions(data: QuestionGenerationRequest):
    skills_text = ", ".join(data.skills) if data.skills else "general professional skills"
    role_text = data.role or data.field
    
    prompt_template = f"""Bạn là chuyên gia tuyển dụng nhân sự cấp cao. Hãy tạo các câu hỏi phỏng vấn cho hồ sơ sau:

TARGET ROLE: {role_text}
FIELD: {data.field}
KEY SKILLS: {skills_text}

CHỈ trả về một mảng JSON hợp lệ gồm 15-20 chuỗi (không có markdown, không có văn bản bên ngoài dấu ngoặc).
Mỗi câu hỏi PHẢI bắt đầu chính xác với một thẻ: [Background], [Situation], hoặc [Technical].

Định dạng ví dụ:
[
  "[Bối cảnh] Hãy kể cho tôi nghe về kinh nghiệm của bạn với việc phân tích dữ liệu.",
  "[Tình huống] Mô tả cách bạn xử lý một hạn chót khó khăn.",
  "[Kỹ thuật] Giải thích các khái niệm chính của học máy."
]

Đặt câu hỏi cụ thể cho vai trò và kỹ năng. CHỈ trả về mảng JSON, không trả về bất kỳ dữ liệu nào khác."""
    
    try:
        response = await model.generate_content_async(prompt_template)
        raw_text = response.text.strip()
        
        # Remove markdown code blocks
        raw_text = re.sub(r'```json\s*', '', raw_text)
        raw_text = re.sub(r'```\s*', '', raw_text)
        
        # Find JSON array
        match = re.search(r'(\[.*\])', raw_text, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Clean up common JSON issues
            json_str = re.sub(r',\s*([\]\}])', r'\1', json_str)  # Remove trailing commas
            json_str = json_str.replace("\n", " ").replace("\r", " ")  # Remove newlines
            
            questions = json.loads(json_str)
            
            if not isinstance(questions, list):
                raise ValueError("Phản hồi không phải là một danh sách")
            
            return JSONResponse(content={"questions": questions})
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "Không thể tìm thấy mảng JSON từ AI.", "raw": raw_text[:500]}
            )
    except json.JSONDecodeError as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Lỗi phân tích JSON: {str(e)}", "raw": raw_text[:500]}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Lỗi khi tạo câu hỏi: {str(e)}"}
        )
    
app.mount("/", 
          StaticFiles(directory="../frontend/public", html=True), 
          name="public")