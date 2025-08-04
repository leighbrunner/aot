# Optimal Settings Guide for RealVisXL V5.0

## Quick Settings for High-Quality Character Generation

### Base Generation Settings (txt2img)
```
Checkpoint: RealVisXL_V5.0_BakedVAE.safetensors
Sampling method: DPM++ 2M SDE Karras (or DPM++ SDE Karras)
Sampling steps: 30-40
Width: 1024
Height: 1024
Batch count: 4-8
Batch size: 1
CFG Scale: 4-6 (lower than typical for more natural results)
Seed: -1 (or fixed for testing)
```

### Prompt Structure
**Positive Prompt Template:**
```
(masterpiece, photorealistic:1.3), ultra-detailed, 8k uhd, sharp focus, film grain,
[character description], [pose/scene], natural lighting, detailed skin texture,
anatomically correct, professional photography
```

**Negative Prompt Template:**
```
(worst quality, low quality:1.4), illustration, 3d, 2d, painting, cartoons, sketch,
blurry, deformed, artifacts, noise, overexposed, mutated, bad anatomy, disfigured,
poorly drawn face, mutation, extra limb, ugly, disgusting, missing limb
```

### Hires Fix Settings (CRITICAL for Quality)
```
Enable: ✓
Upscaler: 4x-UltraSharp (or 4x_foolhardy_Remacri for skin)
Hires upscale: 1.5
Hires steps: 15-20
Denoising strength: 0.2-0.3
Upscale latent space: None
```

### ADetailer Settings (Face/Body Enhancement)
```
Enable: ✓
Model: face_yolov8n.pt
Detection confidence: 0.3
Mask blur: 4
Denoising strength: 0.4
Inpaint padding: 32
Use separate width/height: No
```

## Character-Specific Optimizations

### For Nude Training Images
```
CFG Scale: 4-5 (lower for natural skin)
Denoising: 0.15-0.25 (preserve anatomy)
Add to prompt: "natural skin texture, subsurface scattering, realistic proportions"
```

### For Clothed Variations
```
CFG Scale: 5-6
Denoising: 0.25-0.35
Add to prompt: "fabric texture, clothing physics, natural draping"
```

### For Ass Focus
```
Add to prompt: "from behind, looking over shoulder, arched back, emphasis on curves"
Camera angles: "low angle", "three-quarter view", "dynamic pose"
```

### For Tits Focus
```
Add to prompt: "facing camera, confident pose, natural gravity, realistic proportions"
Camera angles: "eye level", "slight high angle", "portrait orientation"
```

## Performance Settings for Mac

### Launch Arguments (add to webui-mac.sh)
```bash
--opt-sub-quad-attention \
--upcast-sampling \
--no-half-vae \
--medvram \
--disable-nan-check
```

### Memory Management
- Close unnecessary apps
- Use Activity Monitor to watch memory pressure
- If getting "MPS backend out of memory":
  - Reduce batch count to 1-2
  - Lower hires upscale to 1.25
  - Use tiled VAE for very large images

## Workflow for Best Results

### 1. Initial Generation
- Generate at 1024x1024 base
- Use batch count 4-8 for variations
- Save best candidates

### 2. Upscaling Pass
- Select best image
- Use img2img with same prompt
- Denoising: 0.15-0.25
- Upscale to 1536x1536 or 2048x2048

### 3. Face/Detail Fix
- Enable ADetailer
- Run another img2img pass
- Very low denoising: 0.1-0.15

## Common Issues & Solutions

### Issue: Oversaturated Colors
- Lower CFG scale to 4-5
- Add "natural colors, balanced exposure" to prompt

### Issue: Plastic-Looking Skin
- Add "subsurface scattering, skin pores, natural skin texture"
- Use 4x_foolhardy_Remacri upscaler
- Lower denoising strength

### Issue: Anatomical Errors
- Increase sampling steps to 40+
- Add more specific anatomical descriptions
- Use ADetailer with body models

### Issue: Slow Generation (Mac)
- Disable live preview
- Use --medvram flag
- Generate in smaller batches
- Close Chrome/heavy apps

## Recommended Extension Settings

### Ultimate SD Upscale
```
Target size type: Scale from image size
Scale: 2
Upscaler: 4x-UltraSharp
Type: Chess
Tile width: 512
Tile height: 512
Mask blur: 8
Padding: 32
```

### Tiled Diffusion
```
Method: Mixture of Diffusers
Latent tile size: 96
Latent tile overlap: 32
Upscaler: 4x-UltraSharp
```

## Quick Test Prompts

### Test 1: Basic Quality
```
(masterpiece, photorealistic:1.3), beautiful young woman, natural pose,
soft studio lighting, detailed face and eyes, 8k uhd, film grain
```

### Test 2: Anatomy Check
```
(photorealistic:1.3), full body portrait, athletic woman, yoga pose,
natural lighting, detailed anatomy, realistic proportions, skin texture
```

### Test 3: Clothing
```
(photorealistic:1.3), woman in summer dress, outdoor setting,
natural fabric movement, detailed clothing, golden hour lighting
```

Save successful settings as styles in WebUI for consistency!