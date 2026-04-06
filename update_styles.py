import re
from pathlib import Path
import os

def replace_in_file(filepath, old, new):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
    if old in content:
        with open(filepath, 'w') as f:
            f.write(content.replace(old, new))
        print(f"Updated {filepath}")
    else:
        print(f"Could not find exact string in {filepath}")

