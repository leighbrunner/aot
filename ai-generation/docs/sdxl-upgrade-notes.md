# SDXL Model Upgrade Notes

## Overview
Upgraded from Realistic Vision V6 (SD 1.5-based) to RealVisXL V5.0 (SDXL-based) for superior image quality and better consistency.

## Changes Made

### 1. Model Installation (`setup/install-mac.sh`)
- Updated to download RealVisXL V5.0 with BakedVAE from Civitai
- File size: 6.5GB (vs 4GB for SD 1.5)
- VAE is baked into the model for convenience and better color accuracy
- Download URL: https://civitai.com/api/download/models/789646

### 2. Training Parameters (`workflows/train_lora.py`)
- Updated base model path to RealVisXL V5.0
- Increased network dimensions:
  - network_dim: 32 → 64
  - network_alpha: 16 → 32
- Updated resolution settings:
  - resolution: 512x768 → 1024x1024
  - min_bucket_reso: 256 → 768
  - max_bucket_reso: 1024 → 1536

### 3. Generation Settings
- Updated default steps: 50 → 35 (SDXL is more efficient)
- Updated resolution: 512x768 → 1024x1024
- Added SDXL-specific prompt optimizations:
  - Added "8k uhd" and "film grain" for better quality
  - Maintained cfg_scale at 7.5 (optimal for SDXL)

### 4. Configuration Updates (`config/settings.env`)
- DEFAULT_STEPS: 50 → 35
- LORA_NETWORK_DIM: 32 → 64
- LORA_NETWORK_ALPHA: 16 → 32
- LORA_BATCH_SIZE: 2 → 1 (due to higher VRAM usage)

## Benefits of SDXL

1. **Better Quality**: SDXL produces more detailed, higher resolution images
2. **Improved Consistency**: Better character consistency across generations
3. **Native Resolution**: 1024x1024 is SDXL's native resolution
4. **Better Text Understanding**: SDXL has improved prompt comprehension
5. **Faster Generation**: Despite higher resolution, needs fewer steps

## Performance Considerations

- **VRAM Usage**: SDXL uses more VRAM (~12GB recommended)
- **Generation Time**: ~30-60 seconds per image on Apple Silicon
- **Training Time**: LoRA training takes longer but produces better results
- **Storage**: Model files and generated images are larger

## Compatibility Notes

- All scripts have been updated for SDXL compatibility
- The API wrapper uses environment variables, so no code changes needed
- Admin interface remains unchanged
- S3 backup process handles larger files automatically

## Next Steps

1. Complete installation with `./install-mac.sh`
2. Test generation with a single character
3. Verify LoRA training works correctly
4. Begin batch generation of all 40 characters