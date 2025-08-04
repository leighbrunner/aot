# AI Image Generation System

This folder contains the complete infrastructure for generating character images using Stable Diffusion WebUI on your local MacBook Pro.

## Overview

The system consists of:
- **Stable Diffusion WebUI** (Automatic1111) running on your MacBook Pro at `trout.hopto.org:7860`
- **FastAPI wrapper** for authentication and queue management
- **Character profiles** (40 total: 15 Caucasian-inspired, 25 diverse)
- **LoRA training** workflows for character consistency
- **S3 integration** for backup and storage
- **Admin interface** in the voting app

## Setup Instructions

### 1. Install Stable Diffusion WebUI

```bash
cd ai-generation/setup
chmod +x install-mac.sh
./install-mac.sh
```

This will:
- Install dependencies via Homebrew
- Clone Stable Diffusion WebUI
- Set up required extensions (LoRA, Dreambooth, ADetailer, WD14 Tagger)
- Create optimized launch script for Apple Silicon

### 2. Download Base Model

The installation script automatically downloads RealVisXL V5.0 with BakedVAE (SDXL-based) for superior quality.

If you need to download manually:
- Model: RealVisXL V5.0 (BakedVAE version)
- URL: https://civitai.com/api/download/models/789646?type=Model&format=SafeTensor&size=full&fp=fp16
- Size: 6.5GB
- VAE: Baked into the model (no separate download needed)
- Place in: `stable-diffusion-webui/models/Stable-diffusion/`

### 3. Configure Environment

Edit `ai-generation/config/settings.env` with your AWS credentials:
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_IMAGES=your-images-bucket
S3_BUCKET_MODELS=your-models-bucket
```

### 4. Start Services

#### Start Stable Diffusion WebUI:
```bash
cd stable-diffusion-webui
./webui-mac.sh
```

#### Start FastAPI Wrapper:
```bash
cd ai-generation
pip install -r setup/requirements.txt
python api/sd_api_wrapper.py
```

#### Configure Nginx (optional for production):
```bash
# Install Nginx
brew install nginx

# Copy config
cp setup/nginx.conf /usr/local/etc/nginx/servers/sd-api.conf

# Create API key
htpasswd -c /usr/local/etc/nginx/.htpasswd voting-app

# Start Nginx
nginx
```

## Character Creation Workflow

### 1. Generate Training Data

Generate 5-10 nude base images per character:
```bash
cd workflows
python generate_training_data.py --test  # Test with Emma Riley
python generate_training_data.py --characters emma_riley sophia_grant  # Specific characters
```

### 2. Review Training Data

Check images in `models/training_data/{character_id}/`
- Ensure consistent facial features
- Verify proper anatomy
- Check pose variety

### 3. Train LoRA Model

```bash
python train_lora.py emma_riley --auto-run
```

This creates a LoRA model for consistent character generation.

### 4. Generate Final Images

```bash
python create_character.py emma_riley --auto-approve
```

This runs the complete workflow:
1. Generates training data
2. Trains LoRA model
3. Generates 20 final images (10 ass, 10 tits focus)
4. Uploads to S3

## Admin Interface Usage

1. Navigate to Admin → AI Gen in the voting app
2. View character list and generation queue
3. Select a character to generate images
4. Choose settings:
   - Focus: Mixed (50/50), Ass only, or Tits only
   - Count: 1-50 images
   - Include Nude: Adds 25% nude variations
5. Monitor progress in the job queue

## API Endpoints

### Generate Image
```bash
curl -X POST http://localhost:8080/api/generate \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "character_id": "emma_riley",
    "focus": "ass",
    "is_nude": false,
    "batch_size": 1
  }'
```

### Check Job Status
```bash
curl http://localhost:8080/api/status/{job_id} \
  -H "Authorization: Bearer your-api-key"
```

### List Characters
```bash
curl http://localhost:8080/api/characters \
  -H "Authorization: Bearer your-api-key"
```

## Prompt System

The system uses a modular prompt generator with 3,750+ unique combinations:

### Elements:
- **Scenes**: poolside, gym, beach, bedroom, etc. (15 options)
- **Poses**: Focus-specific poses (8 per focus type)
- **Lighting**: natural, golden hour, dramatic, etc. (8 options)
- **Accessories**: jewelry, sunglasses, tattoos, etc. (8 options)
- **Clothing**: bikini, sports bra, lingerie, nude, etc. (8 options)

### Example Generated Prompt:
```
photorealistic young woman, Instagram model aesthetic, poolside, 
arching back looking over shoulder, emphasizing lower body curves, 
wearing micro bikini, golden hour warm glow, sunglasses, 
high resolution, detailed skin, <lora:emma_riley_lora:1.0>
```

## Tag Extraction

Images are automatically tagged with:
- Character metadata (ethnicity, body type, etc.)
- Image specifics (focus, scene, clothing, etc.)
- NSFW flag
- Generation parameters

Tags are stored in:
- Local SQLite database
- S3 metadata
- DynamoDB (when integrated with voting app)

## Troubleshooting

### Common Issues

1. **MPS errors on Mac**:
   ```bash
   export PYTORCH_ENABLE_MPS_FALLBACK=1
   ```

2. **Memory issues**:
   - Close other apps
   - Reduce batch size to 1
   - Use `--lowvram` flag

3. **Slow generation**:
   - Normal: 10-30 seconds per image on M1/M2/M3
   - Use `caffeinate` to prevent sleep

4. **API connection issues**:
   - Check SD WebUI is running
   - Verify port 7860 is accessible
   - Check API key in settings.env

## Maintenance

### Backup LoRA Models
```bash
cd scripts
python s3_sync.py sync emma_riley
```

### Download LoRA from S3
```bash
python s3_sync.py download emma_riley
```

### Clean up old jobs
```bash
# In Python
from api.sd_api_wrapper import SessionLocal, GenerationJob
db = SessionLocal()
old_jobs = db.query(GenerationJob).filter(GenerationJob.status == 'completed').all()
for job in old_jobs:
    db.delete(job)
db.commit()
```

## Security Notes

- Never expose SD WebUI directly to internet
- Use Nginx proxy with authentication
- Keep API keys secure
- Regularly update dependencies
- Monitor S3 costs

## Performance Tips

1. **Batch Processing**: Process 5 characters at a time
2. **Overnight Runs**: Use `caffeinate` for long training
3. **SSD Storage**: Keep models on fast storage
4. **Regular Cleanup**: Delete training data after LoRA creation
5. **Monitor Heat**: MacBooks throttle when hot

## Future Enhancements

- [ ] ComfyUI integration for complex workflows
- [ ] Real-time progress WebSocket updates
- [ ] Automatic quality assessment
- [ ] Style transfer capabilities
- [ ] Video generation support