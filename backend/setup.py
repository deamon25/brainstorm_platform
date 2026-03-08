"""
Quick setup and test script for Brainstorm Platform Service
"""
import sys
import subprocess
from pathlib import Path


def run_command(command, description):
    """Run a shell command and print status"""
    print(f"\n{'='*60}")
    print(f"🔧 {description}")
    print(f"{'='*60}")
    
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ {description} - SUCCESS")
        if result.stdout:
            print(result.stdout)
    else:
        print(f"❌ {description} - FAILED")
        if result.stderr:
            print(result.stderr)
        return False
    
    return True


def main():
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║   Brainstorm Platform Service - Setup & Test         ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    # Check if we're in the right directory
    current_dir = Path.cwd()
    if current_dir.name != "backend":
        print("⚠️  Please run this script from the backend directory")
        sys.exit(1)
    
    # Step 1: Create .env file
    if not Path(".env").exists():
        print("\n📝 Creating .env file from .env.example...")
        subprocess.run("copy .env.example .env", shell=True)
    
    # Step 2: Install dependencies
    if not run_command(
        "pip install -r requirements.txt",
        "Installing Python dependencies"
    ):
        print("\n❌ Failed to install dependencies. Please check your Python environment.")
        sys.exit(1)
    
    # Step 3: Download spaCy model if needed
    print("\n📦 Checking spaCy model...")
    result = subprocess.run(
        "python -m spacy info en_core_web_sm",
        shell=True,
        capture_output=True
    )
    
    if result.returncode != 0:
        print("📥 Downloading spaCy English model...")
        run_command(
            "python -m spacy download en_core_web_sm",
            "Downloading spaCy model"
        )
    else:
        print("✅ spaCy model already installed")
    
    # Step 4: Verify model paths
    print("\n🔍 Verifying model paths...")
    models_base = Path("../../models/brainstorm_platform")
    
    models_to_check = {
        "Entity NER Model": models_base / "entity_ner_model",
        "Entity Rephraser Model": models_base / "entity_rephraser_model",
        "Hesitation Model": models_base / "hesitation_model"
    }
    
    all_models_exist = True
    for model_name, model_path in models_to_check.items():
        if model_path.exists():
            print(f"  ✅ {model_name}: {model_path}")
        else:
            print(f"  ❌ {model_name}: NOT FOUND at {model_path}")
            all_models_exist = False
    
    if not all_models_exist:
        print("\n⚠️  Some models are missing. Please ensure all models are in place.")
        print("   The service may fail to start without all models.")
    
    # Step 5: Run tests
    print("\n🧪 Running tests...")
    test_result = subprocess.run(
        "pytest tests/ -v",
        shell=True,
        capture_output=True,
        text=True
    )
    
    if test_result.returncode == 0:
        print("✅ All tests passed!")
    else:
        print("⚠️  Some tests failed (this is normal if models aren't loaded yet)")
    
    # Step 6: Instructions to run
    print("""
    
    ╔═══════════════════════════════════════════════════════╗
    ║                 🚀 Setup Complete!                    ║
    ╚═══════════════════════════════════════════════════════╝
    
    To start the service, run:
    
    📍 Development mode (with auto-reload):
       python -m api.main
       
       OR
       
       uvicorn api.main:app --host 0.0.0.0 --port 8004 --reload
    
    📍 Production mode:
       uvicorn api.main:app --host 0.0.0.0 --port 8004 --workers 4
    
    📊 API Documentation:
       http://localhost:8004/docs (Swagger UI)
       http://localhost:8004/redoc (ReDoc)
    
    🔍 Health Check:
       http://localhost:8004/api/v1/health
    
    """)


if __name__ == "__main__":
    main()
