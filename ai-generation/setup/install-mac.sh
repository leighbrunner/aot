#!/bin/bash

# Stable Diffusion WebUI Installation Script for macOS
# This script sets up Automatic1111's WebUI with LoRA support

set -e

echo "=== Stable Diffusion WebUI Installation for macOS ==="
echo "This script will install SD WebUI with optimal settings for Apple Silicon"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install dependencies
echo "Installing required dependencies..."
brew install cmake protobuf rust python@3.10 git wget

# Create virtual environment
echo "Creating Python virtual environment..."
python3.10 -m venv sd-venv
source sd-venv/bin/activate

# Clone Stable Diffusion WebUI
if [ ! -d "stable-diffusion-webui" ]; then
    echo "Cloning Stable Diffusion WebUI..."
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
fi

cd stable-diffusion-webui

# Download RealVisXL model
echo "Downloading RealVisXL V5.0 model..."
mkdir -p models/Stable-diffusion
if [ ! -f "models/Stable-diffusion/RealVisXL_V5.0_BakedVAE.safetensors" ]; then
    echo "Downloading RealVisXL V5.0 with BakedVAE (SDXL-based, superior quality)..."
    echo "This is a 6.5GB download from Civitai, please wait..."
    wget -c "https://civitai.com/api/download/models/789646?type=Model&format=SafeTensor&size=full&fp=fp16" \
         -O models/Stable-diffusion/RealVisXL_V5.0_BakedVAE.safetensors
    
    # No need for separate VAE download since it's baked in
    echo "Note: VAE is baked into the model, no separate download needed"
fi

# Install extensions
echo "Installing required extensions..."
cd extensions

# LoRA training support
if [ ! -d "sd-webui-additional-networks" ]; then
    git clone https://github.com/kohya-ss/sd-webui-additional-networks.git
fi

# Dreambooth extension
if [ ! -d "sd_dreambooth_extension" ]; then
    git clone https://github.com/d8ahazard/sd_dreambooth_extension.git
fi

# ADetailer for body fixes
if [ ! -d "adetailer" ]; then
    git clone https://github.com/Bing-su/adetailer.git
fi

# WD14 Tagger for auto-tagging
if [ ! -d "sd-webui-wd14-tagger" ]; then
    git clone https://github.com/toriato/stable-diffusion-webui-wd14-tagger.git
fi

cd ..

# Install ESRGAN and high-quality upscalers
echo "Installing ESRGAN upscalers for enhanced image quality..."
mkdir -p models/ESRGAN
mkdir -p models/RealESRGAN
mkdir -p models/SwinIR

# Download essential upscalers
echo "Downloading 4x-UltraSharp..."
if [ ! -f "models/ESRGAN/4x-UltraSharp.pth" ]; then
    wget -c https://huggingface.co/lokCX/4x-Ultrasharp/resolve/main/4x-UltraSharp.pth \
         -O models/ESRGAN/4x-UltraSharp.pth || echo "Warning: Could not download 4x-UltraSharp"
fi

echo "Downloading RealESRGAN_x4plus..."
if [ ! -f "models/RealESRGAN/RealESRGAN_x4plus.pth" ]; then
    wget -c https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth \
         -O models/RealESRGAN/RealESRGAN_x4plus.pth || echo "Warning: Could not download RealESRGAN_x4plus"
fi

echo "Downloading RealESRGAN_x4plus_anime_6B..."
if [ ! -f "models/RealESRGAN/RealESRGAN_x4plus_anime_6B.pth" ]; then
    wget -c https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth \
         -O models/RealESRGAN/RealESRGAN_x4plus_anime_6B.pth || echo "Warning: Could not download RealESRGAN_x4plus_anime_6B"
fi

# Install upscaling extensions
cd extensions

# Ultimate SD Upscale
if [ ! -d "ultimate-upscale-for-automatic1111" ]; then
    echo "Installing Ultimate SD Upscale extension..."
    git clone https://github.com/Coyote-A/ultimate-upscale-for-automatic1111.git
fi

# Tiled Diffusion & VAE
if [ ! -d "multidiffusion-upscaler-for-automatic1111" ]; then
    echo "Installing Tiled Diffusion extension..."
    git clone https://github.com/pkuliyi2015/multidiffusion-upscaler-for-automatic1111.git
fi

cd ..

# Create launch script with optimal settings
cat > webui-mac.sh << 'EOL'
#!/bin/bash
source ../sd-venv/bin/activate

# Launch with API enabled and Mac-optimized settings for SDXL
./webui.sh \
    --api \
    --api-auth voting-app:$(openssl rand -base64 32) \
    --listen \
    --port 7860 \
    --cors-allow-origins=* \
    --skip-torch-cuda-test \
    --upcast-sampling \
    --no-half-vae \
    --use-cpu interrogate \
    --precision full \
    --no-half \
    --opt-sub-quad-attention \
    --disable-nan-check \
    --medvram
EOL

chmod +x webui-mac.sh

# Create API key file
echo "voting-app:$(openssl rand -base64 32)" > api_key.txt

echo ""
echo "=== Installation Complete ==="
echo "Your API key has been saved to: api_key.txt"
echo ""
echo "Installed components:"
echo "✓ Stable Diffusion WebUI with Automatic1111"
echo "✓ RealVisXL V5.0 with BakedVAE (SDXL model)"
echo "✓ ESRGAN upscalers (4x-UltraSharp, RealESRGAN)"
echo "✓ Extensions: LoRA, Dreambooth, ADetailer, WD14 Tagger"
echo "✓ Upscaling extensions: Ultimate SD Upscale, Tiled Diffusion"
echo ""
echo "To start the WebUI:"
echo "1. cd stable-diffusion-webui"
echo "2. ./webui-mac.sh"
echo ""
echo "The WebUI will be available at: http://localhost:7860"
echo "API endpoint: http://localhost:7860/sdapi/v1/txt2img"
echo ""
echo "Recommended settings for best quality:"
echo "- Enable Hires Fix with 4x-UltraSharp upscaler"
echo "- Use DPM++ 2M SDE Karras sampler"
echo "- Set CFG Scale to 4-6 (lower than default)"
echo "- Generate at 1024x1024 base resolution"