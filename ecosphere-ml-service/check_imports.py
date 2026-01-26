# check_imports.py
import ast
import os
import sys

def get_imports_from_file(filepath):
    """Extract all imports from a Python file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    imports = set()
    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except:
        pass
    
    return imports

# Check your main files
files = ['solar_forecast_service.py', 'weather_service.py', 'node_service.py']
all_imports = set()

for file in files:
    if os.path.exists(file):
        imports = get_imports_from_file(file)
        print(f"\n{file}:")
        for imp in sorted(imports):
            print(f"  - {imp}")
        all_imports.update(imports)

print(f"\n{'='*50}")
print(f"TOTAL UNIQUE IMPORTS: {len(all_imports)}")
print("="*50)
for imp in sorted(all_imports):
    print(f"  - {imp}")