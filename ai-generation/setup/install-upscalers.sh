#!/bin/bash

# ESRGAN and Upscaler Installation Script for Stable Diffusion WebUI
# This script installs high-quality upscalers for enhanced image generation

set -e

echo "=== Installing ESRGAN and High-Quality Upscalers ==="
echo "This will download several upscaling models for better image quality"
echo ""

# Navigate to SD WebUI directory
cd "$(dirname "$0")/stable-diffusion-webui"

# Create models directories if they don't exist
mkdir -p models/ESRGAN
mkdir -p models/RealESRGAN
mkdir -p models/SwinIR

# Download ESRGAN models
echo "Downloading ESRGAN models..."

# 4x-UltraSharp - Excellent for general upscaling
if [ ! -f "models/ESRGAN/4x-UltraSharp.pth" ]; then
    echo "Downloading 4x-UltraSharp..."
    wget -c https://huggingface.co/lokCX/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth \
         -O models/ESRGAN/4x-UltraSharp.pth
fi

# 4x_NMKD-Siax_200k - Great for photorealistic content
if [ ! -f "models/ESRGAN/4x_NMKD-Siax_200k.pth" ]; then
    echo "Downloading 4x_NMKD-Siax_200k..."
    wget -c https://huggingface.co/gemasai/4x_NMKD-Siax_200k/resolve/main/4x_NMKD-Siax_200k.pth \
         -O models/ESRGAN/4x_NMKD-Siax_200k.pth
fi

# RealESRGAN_x4plus - Optimized for real-world images
if [ ! -f "models/RealESRGAN/RealESRGAN_x4plus.pth" ]; then
    echo "Downloading RealESRGAN_x4plus..."
    wget -c https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
         -O models/RealESRGAN/RealESRGAN_x4plus.pth
fi

# RealESRGAN_x4plus_anime_6B - Good for stylized content
if [ ! -f "models/RealESRGAN/RealESRGAN_x4plus_anime_6B.pth" ]; then
    echo "Downloading RealESRGAN_x4plus_anime_6B..."
    wget -c https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth \
         -O models/RealESRGAN/RealESRGAN_x4plus_anime_6B.pth
fi

# 4x_foolhardy_Remacri - Excellent for skin and details
if [ ! -f "models/ESRGAN/4x_foolhardy_Remacri.pth" ]; then
    echo "Downloading 4x_foolhardy_Remacri..."
    wget -c https://huggingface.co/FoolhardyRook/4x_foolhardy_Remacri/resolve/main/4x_foolhardy_Remacri.pth \
         -O models/ESRGAN/4x_foolhardy_Remacri.pth
fi

# SwinIR models for advanced upscaling
echo "Downloading SwinIR models..."

# SwinIR_4x - State-of-the-art upscaler
if [ ! -f "models/SwinIR/SwinIR_4x.pth" ]; then
    echo "Downloading SwinIR_4x..."
    wget -c https://github.com/JingyunLiang/SwinIR/releases/download/v0.0/001_classicalSR_DIV2K_s48w8_SwinIR-M_x4.pth \
         -O models/SwinIR/SwinIR_4x.pth
fi

# Install/Update necessary extensions
echo ""
echo "Installing/Updating extensions..."

cd extensions

# Ultimate SD Upscale - Advanced upscaling extension
if [ ! -d "ultimate-upscale-for-automatic1111" ]; then
    echo "Installing Ultimate SD Upscale..."
    git clone https://github.com/Coyote-A/ultimate-upscale-for-automatic1111.git
else
    echo "Updating Ultimate SD Upscale..."
    cd ultimate-upscale-for-automatic1111
    git pull
    cd ..
fi

# SD Upscale - Built-in upscaling improvements
if [ ! -d "sd-webui-upscale" ]; then
    echo "Installing SD WebUI Upscale..."
    git clone https://github.com/Coyote-A/sd-webui-upscale.git
else
    echo "Updating SD WebUI Upscale..."
    cd sd-webui-upscale
    git pull
    cd ..
fi

# Tiled Diffusion & VAE - For very high resolution without OOM
if [ ! -d "multidiffusion-upscaler-for-automatic1111" ]; then
    echo "Installing Tiled Diffusion..."
    git clone https://github.com/pkuliyi2015/multidiffusion-upscaler-for-automatic1111.git
else
    echo "Updating Tiled Diffusion..."
    cd multidiffusion-upscaler-for-automatic1111
    git pull
    cd ..
fi

cd ..

# Create upscaler info file
cat > models/ESRGAN/upscaler_guide.md << 'EOL'
# Upscaler Guide for Character Generation

## Recommended Settings for Your Use Case

### For Character Images (Photorealistic Nudes/Clothed):
1. **Primary**: 4x-UltraSharp or 4x_foolhardy_Remacri
   - Best for skin texture and anatomical details
   - Upscale by: 1.5-2x
   - Denoising: 0.1-0.3

2. **Alternative**: RealESRGAN_x4plus
   - Good general purpose upscaler
   - Works well with all content types

### Hires Fix Settings:
- Enable Hires Fix
- Upscaler: 4x-UltraSharp
- Upscale by: 1.5
- Hires steps: 15-20
- Denoising strength: 0.2-0.3
- Upscaler for img2img: None
- Resize width to: 1536
- Resize height to: 1536

### For Batch Processing:
- Use Ultimate SD Upscale extension
- Tile size: 512
- Padding: 32
- Mask blur: 8
- Seam fix width: 16

### Performance Tips for Mac:
- Start with lower upscale factors (1.5x)
- Use tiled processing for very large images
- Enable "Upcast cross attention layer to float32" in settings
- Set COMMANDLINE_ARGS="--opt-sub-quad-attention --upcast-sampling" in webui-user.sh

### Quality Priority (Best to Good):
1. SwinIR_4x - Highest quality, slowest
2. 4x_foolhardy_Remacri - Excellent for skin
3. 4x-UltraSharp - Great all-around
4. 4x_NMKD-Siax_200k - Fast and good
5. RealESRGAN_x4plus - Reliable fallback
EOL

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Installed upscalers:"
echo "✓ 4x-UltraSharp (general purpose)"
echo "✓ 4x_NMKD-Siax_200k (photorealistic)"
echo "✓ RealESRGAN_x4plus (real-world images)"
echo "✓ RealESRGAN_x4plus_anime_6B (stylized)"
echo "✓ 4x_foolhardy_Remacri (skin details)"
echo "✓ SwinIR_4x (highest quality)"
echo ""
echo "Installed extensions:"
echo "✓ Ultimate SD Upscale"
echo "✓ SD WebUI Upscale"
echo "✓ Tiled Diffusion & VAE"
echo ""
echo "To use these upscalers:"
echo "1. Restart Stable Diffusion WebUI"
echo "2. Enable 'Hires. fix' in txt2img"
echo "3. Select an upscaler from the dropdown"
echo "4. Set upscale factor (1.5 recommended for Mac)"
echo ""
echo "Check models/ESRGAN/upscaler_guide.md for detailed usage instructions"