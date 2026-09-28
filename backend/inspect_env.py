import os
import sys

print(f"Python: {sys.executable} ({sys.version})")

modules = [
    "numpy",
    "scipy",
    "sklearn",
    "PIL",
    "fitz",
    "cv2",
    "torch",
    "torchvision",
    "joblib",
    "pandas"
]

for m in modules:
    try:
        mod = __import__(m)
        version = getattr(mod, "__version__", "available")
        print(f"  {m}: {version}")
    except ImportError:
        print(f"  {m}: NOT INSTALLED")
