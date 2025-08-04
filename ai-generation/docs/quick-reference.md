# Quick Reference - Optimal Settings for RealVisXL V5.0

## Copy-Paste Settings for WebUI

### Base Generation (txt2img)
```
Sampling method: DPM++ 2M SDE Karras
Sampling steps: 35
Width: 1024
Height: 1024
CFG Scale: 5
```

### Hires Fix (Enable this!)
```
Upscaler: 4x-UltraSharp
Hires upscale: 1.5
Hires steps: 20
Denoising strength: 0.25
```

### Prompt Templates

#### Basic Quality Boost (Add to all prompts)
```
(masterpiece, photorealistic:1.3), ultra-detailed, 8k uhd, sharp focus, film grain
```

#### Universal Negative (Use for all)
```
(worst quality, low quality:1.4), illustration, 3d, 2d, painting, cartoons, sketch, blurry, deformed, artifacts, noise, overexposed, mutated, bad anatomy
```

## Character Generation Prompts

### Training Data (Nude)
```
Positive: (photorealistic:1.3), full body portrait, [character details], nude, detailed anatomy, natural skin texture, studio lighting, neutral background
Negative: clothes, underwear, censorship, blurry, deformed, bad anatomy
```

### Ass Focus
```
Positive: from behind, looking over shoulder, arched back, emphasis on curves, [clothing/nude], natural lighting
Negative: front view, face focus, upper body only
```

### Tits Focus  
```
Positive: facing camera, confident pose, natural gravity, [clothing/nude], soft lighting
Negative: back view, lower body focus, flat chest
```

## Performance Settings (Mac)

### If Getting Errors
Add to launch command:
```
--medvram --opt-sub-quad-attention --disable-nan-check
```

### For Faster Generation
- Disable live preview
- Close other apps
- Use batch size 1
- Reduce hires upscale to 1.25

## Available Upscalers (Best to Good)
1. **4x-UltraSharp** - Best all-around
2. **RealESRGAN_x4plus** - Great for photos
3. **RealESRGAN_x4plus_anime_6B** - For stylized
4. **Lanczos** - Fast fallback

## Troubleshooting

**Plastic skin?** → Lower CFG to 4, add "subsurface scattering"
**Too saturated?** → Lower CFG, add "natural colors"
**Blurry?** → Increase steps to 40, check upscaler
**Slow?** → Disable hires fix for drafts, use overnight

## Workflow
1. Generate 4-8 variations at 1024x1024
2. Pick best → Enable hires fix → Regenerate
3. Optional: img2img at 0.2 denoising for refinement