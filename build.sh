#!/bin/bash

# Build script for Go Create - Voice Dictation App with Whisper.cpp
# This script sets up the necessary environment variables and builds the app

set -e  # Exit on error

echo "==========================================="
echo "Building Go Create - Voice Dictation App"
echo "==========================================="

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Project directory: $PROJECT_DIR"
echo ""

# Set environment variables for CGO to find Whisper libraries
echo "Setting up environment variables for Whisper.cpp..."
export C_INCLUDE_PATH="$PROJECT_DIR/whisper.cpp/include:$PROJECT_DIR/whisper.cpp/ggml/include"
export LIBRARY_PATH="$PROJECT_DIR/whisper.cpp/build_go/src:$PROJECT_DIR/whisper.cpp/build_go/ggml/src:$PROJECT_DIR/whisper.cpp/build_go/ggml/src/ggml-blas:$PROJECT_DIR/whisper.cpp/build_go/ggml/src/ggml-metal"
export GGML_METAL_PATH_RESOURCES="$PROJECT_DIR/bundled-resources"

echo "✓ C_INCLUDE_PATH set"
echo "✓ LIBRARY_PATH set"
echo "✓ GGML_METAL_PATH_RESOURCES set"
echo ""

# Check if Whisper libraries exist
echo "Checking for Whisper libraries..."
if [ ! -f "$PROJECT_DIR/whisper.cpp/build_go/src/libwhisper.a" ]; then
    echo "❌ Error: Whisper library not found!"
    echo "Please build the Whisper library first:"
    echo "  cd whisper.cpp/bindings/go"
    echo "  make whisper"
    echo "  cd ../../.."
    exit 1
fi
echo "✓ Whisper library found"
echo ""

# Check if model exists
echo "Checking for bundled model..."
if [ ! -f "$PROJECT_DIR/bundled-resources/models/ggml-medium.en.bin" ]; then
    echo "❌ Error: Model file not found!"
    echo "The model should be at: bundled-resources/models/ggml-medium.en.bin"
    exit 1
fi
echo "✓ Model file found"
echo ""

# Check if Metal shader exists
echo "Checking for Metal shader..."
if [ ! -f "$PROJECT_DIR/bundled-resources/ggml-metal.metal" ]; then
    echo "❌ Error: Metal shader not found!"
    echo "The shader should be at: bundled-resources/ggml-metal.metal"
    exit 1
fi
echo "✓ Metal shader found"
echo ""

# Build the app
echo "Building the application..."
echo "This may take a few minutes..."
echo ""
wails build

echo ""
echo "Bundling resources into .app package..."
# Copy model and Metal shader into the app bundle's Resources folder
APP_RESOURCES="$PROJECT_DIR/build/bin/go-create.app/Contents/Resources"

# Create models directory in Resources
mkdir -p "$APP_RESOURCES/models"

# Copy the model file
cp "$PROJECT_DIR/bundled-resources/models/ggml-medium.en.bin" "$APP_RESOURCES/models/"
echo "✓ Copied model to: $APP_RESOURCES/models/"

# Copy the Metal shader
cp "$PROJECT_DIR/bundled-resources/ggml-metal.metal" "$APP_RESOURCES/"
echo "✓ Copied Metal shader to: $APP_RESOURCES/"

echo ""
echo "==========================================="
echo "✓ Build completed successfully!"
echo "==========================================="
echo ""
echo "Your app is located at: $PROJECT_DIR/build/bin/go-create.app"
echo ""
echo "To run the app:"
echo "  open build/bin/go-create.app"
echo ""
echo "Note: Make sure you have ffmpeg installed:"
echo "  brew install ffmpeg"
echo ""
