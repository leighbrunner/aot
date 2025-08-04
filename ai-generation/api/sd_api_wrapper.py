"""
FastAPI wrapper for Stable Diffusion WebUI API
Provides authentication, queuing, and monitoring
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import httpx
import asyncio
import json
import base64
import os
from datetime import datetime
from dotenv import load_dotenv
import logging
from sqlalchemy import create_engine, Column, String, DateTime, JSON, Integer
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import boto3
from botocore.exceptions import NoCredentialsError

# Load environment variables
load_dotenv('../config/settings.env')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
Base = declarative_base()
engine = create_engine(os.getenv('DATABASE_URL', 'sqlite:///./ai_generation.db'))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# S3 client
s3_client = boto3.client(
    's3',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

# FastAPI app
app = FastAPI(title="AI Generation API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database Models
class GenerationJob(Base):
    __tablename__ = "generation_jobs"
    
    id = Column(String, primary_key=True)
    character_id = Column(String)
    status = Column(String)  # pending, processing, completed, failed
    prompt = Column(String)
    tags = Column(JSON)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(String)

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(String, primary_key=True)
    name = Column(String)
    character_metadata = Column(JSON)
    lora_path = Column(String)
    training_status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic models
class GenerateImageRequest(BaseModel):
    character_id: str
    focus: str = Field(..., pattern="^(ass|tits)$")
    is_nude: bool = False
    scene: Optional[str] = None
    pose: Optional[str] = None
    lighting: Optional[str] = None
    accessory: Optional[str] = None
    batch_size: int = Field(1, ge=1, le=4)

class GenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Authentication
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    api_key = credentials.credentials
    expected_key = os.getenv('API_KEY_SECRET')
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SD API client
class SDAPIClient:
    def __init__(self):
        self.base_url = os.getenv('SD_API_URL')
        self.timeout = int(os.getenv('SD_API_TIMEOUT', 600))
        
    async def generate_image(self, prompt: str, negative_prompt: str, **kwargs):
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            payload = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": int(os.getenv('DEFAULT_STEPS', 50)),
                "sampler_name": os.getenv('DEFAULT_SAMPLER', 'DPM++ 2M Karras'),
                "cfg_scale": float(os.getenv('DEFAULT_CFG_SCALE', 7.5)),
                "width": kwargs.get('width', int(os.getenv('DEFAULT_WIDTH', 1024))),
                "height": kwargs.get('height', int(os.getenv('DEFAULT_HEIGHT', 1024))),
                "batch_size": kwargs.get('batch_size', 1),
                "seed": kwargs.get('seed', -1),
            }
            
            response = await client.post(f"{self.base_url}/sdapi/v1/txt2img", json=payload)
            response.raise_for_status()
            return response.json()
    
    async def get_progress(self):
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/sdapi/v1/progress")
            return response.json()

sd_client = SDAPIClient()

# S3 upload function
async def upload_to_s3(file_data: bytes, bucket: str, key: str, metadata: dict = None):
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=file_data,
            ContentType='image/png',
            Metadata=metadata or {}
        )
        return f"s3://{bucket}/{key}"
    except NoCredentialsError:
        logger.error("S3 credentials not found")
        raise
    except Exception as e:
        logger.error(f"S3 upload failed: {e}")
        raise

# Background task for image generation
async def process_generation_job(job_id: str, request: GenerateImageRequest):
    db = SessionLocal()
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
    
    try:
        job.status = "processing"
        db.commit()
        
        # Load character data
        with open('../config/characters.json', 'r') as f:
            characters_data = json.load(f)
        
        character = next((c for c in characters_data['characters'] if c['id'] == request.character_id), None)
        if not character:
            raise ValueError(f"Character {request.character_id} not found")
        
        # Build prompt from template
        import sys
        sys.path.append('..')
        from scripts.prompt_generator import PromptGenerator
        generator = PromptGenerator()
        prompt, tags = generator.generate_prompt(
            character_id=request.character_id,
            character_lora=f"{request.character_id}_lora",
            focus=request.focus,
            is_nude=request.is_nude,
            scene=request.scene,
            pose=request.pose,
            lighting=request.lighting,
            accessory=request.accessory
        )
        
        # Generate images
        result = await sd_client.generate_image(
            prompt=prompt,
            negative_prompt="blurry, deformed, ugly, extra limbs, artifacts, low quality",
            batch_size=request.batch_size
        )
        
        # Process and upload images
        images = result.get('images', [])
        uploaded_images = []
        
        for idx, img_base64 in enumerate(images):
            img_data = base64.b64decode(img_base64)
            
            # Generate filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            filename = f"{request.character_id}_{request.focus}_{timestamp}_{idx}.png"
            
            # Upload to S3
            s3_url = await upload_to_s3(
                img_data,
                os.getenv('S3_BUCKET_IMAGES'),
                f"generated/{request.character_id}/{filename}",
                metadata={
                    'character_id': request.character_id,
                    'focus': request.focus,
                    'tags': json.dumps(tags),
                    'prompt': prompt
                }
            )
            
            uploaded_images.append({
                'url': s3_url,
                'filename': filename,
                'tags': tags
            })
        
        # Update job
        job.status = "completed"
        job.result = {
            'images': uploaded_images,
            'prompt': prompt,
            'parameters': result.get('parameters', {})
        }
        job.tags = tags
        job.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        logger.error(f"Generation job {job_id} failed: {e}")
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()

# API Endpoints
@app.post("/api/generate", response_model=GenerationResponse)
async def generate_image(
    request: GenerateImageRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Generate images for a character"""
    # Create job
    job_id = f"job_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{request.character_id}"
    job = GenerationJob(
        id=job_id,
        character_id=request.character_id,
        status="pending",
        prompt=f"Generating {request.focus} focused image for {request.character_id}"
    )
    db.add(job)
    db.commit()
    
    # Queue background task
    background_tasks.add_task(process_generation_job, job_id, request)
    
    return GenerationResponse(
        job_id=job_id,
        status="pending",
        message="Generation job queued successfully"
    )

@app.get("/api/status/{job_id}", response_model=JobStatus)
async def get_job_status(
    job_id: str,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Get status of a generation job"""
    job = db.query(GenerationJob).filter(GenerationJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get progress from SD API if processing
    progress = 0.0
    if job.status == "processing":
        try:
            sd_progress = await sd_client.get_progress()
            progress = sd_progress.get('progress', 0.0)
        except:
            progress = 0.5
    elif job.status == "completed":
        progress = 1.0
    
    return JobStatus(
        job_id=job.id,
        status=job.status,
        progress=progress,
        result=job.result,
        error=job.error_message
    )

@app.get("/api/characters")
async def list_characters(
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """List all available characters"""
    with open('../config/characters.json', 'r') as f:
        characters = json.load(f)
    return characters

@app.get("/api/jobs")
async def list_jobs(
    character_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """List generation jobs with optional filters"""
    query = db.query(GenerationJob)
    
    if character_id:
        query = query.filter(GenerationJob.character_id == character_id)
    if status:
        query = query.filter(GenerationJob.status == status)
    
    jobs = query.order_by(GenerationJob.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": job.id,
            "character_id": job.character_id,
            "status": job.status,
            "created_at": job.created_at.isoformat(),
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "tags": job.tags,
            "error": job.error_message
        }
        for job in jobs
    ]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)