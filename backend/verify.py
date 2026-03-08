"""
Quick test script to verify backend setup
"""
import sys
from pathlib import Path


def check_files():
    """Check if all necessary files exist"""
    print("🔍 Checking file structure...\n")
    
    required_files = [
        "api/main.py",
        "api/routes.py",
        "core/config.py",
        "core/schemas.py",
        "inference/model_loader.py",
        "inference/entity_extraction.py",
        "inference/rephraser.py",
        "inference/hesitation_detector.py",
        "requirements.txt",
        "run.py"
    ]
    
    all_good = True
    for file_path in required_files:
        path = Path(file_path)
        if path.exists():
            print(f"  ✅ {file_path}")
        else:
            print(f"  ❌ {file_path} - MISSING")
            all_good = False
    
    return all_good


def check_models():
    """Check if model directories exist"""
    print("\n🧠 Checking model directories...\n")
    
    models_base = Path("../../models/brainstorm_platform")
    
    model_dirs = {
        "Entity NER Model": models_base / "entity_ner_model",
        "Entity Rephraser Model": models_base / "entity_rephraser_model",
        "Hesitation Model": models_base / "hesitation_model"
    }
    
    all_good = True
    for name, path in model_dirs.items():
        if path.exists():
            print(f"  ✅ {name}: {path.absolute()}")
        else:
            print(f"  ❌ {name}: NOT FOUND at {path.absolute()}")
            all_good = False
    
    return all_good


def check_dependencies():
    """Check if key dependencies are installed"""
    print("\n📦 Checking key dependencies...\n")
    
    dependencies = {
        "fastapi": "FastAPI web framework",
        "uvicorn": "ASGI server",
        "spacy": "NER model library",
        "transformers": "T5 model library",
        "torch": "PyTorch",
        "sklearn": "Hesitation model library"
    }
    
    all_good = True
    for module, description in dependencies.items():
        try:
            __import__(module)
            print(f"  ✅ {module:15} - {description}")
        except ImportError:
            print(f"  ❌ {module:15} - NOT INSTALLED ({description})")
            all_good = False
    
    return all_good


def main():
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║   Brainstorm Platform - Verification Check           ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    # Check current directory
    if not Path("api").exists():
        print("❌ Error: Please run this script from services/brainstorm_platform directory")
        sys.exit(1)
    
    # Run all checks
    files_ok = check_files()
    models_ok = check_models()
    deps_ok = check_dependencies()
    
    # Summary
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    
    print(f"\nFile Structure:    {'✅ PASS' if files_ok else '❌ FAIL'}")
    print(f"Model Directories: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"Dependencies:      {'✅ PASS' if deps_ok else '❌ FAIL'}")
    
    if files_ok and models_ok and deps_ok:
        print("\n🎉 All checks passed! You're ready to start the service.")
        print("\nRun: python run.py")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        
        if not deps_ok:
            print("\nTo install dependencies:")
            print("  pip install -r requirements.txt")
        
        if not models_ok:
            print("\nPlease ensure all model files are in place.")
    
    print("\n")


if __name__ == "__main__":
    main()
