import os

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace 'from xxx' with 'from xxx'
        # Replace 'import xxx' with 'import xxx'
        # We also need to fix indentation for 'from xxx' if it was messed up
        # BUT let's just do the prefix first.
        
        new_content = content.replace('from ', 'from ')
        new_content = new_content.replace('import ', 'import ')
        
        if content != new_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
            return True
    except Exception as e:
        print(f"Failed: {file_path} - {e}")
    return False

# Base directory for the backend
backend_dir = r"c:\Users\hp\Music\school-Management-system\backend"

for root, dirs, files in os.walk(backend_dir):
    # Skip non-app directories if needed, but let's just do all .py files
    for file in files:
        if file.endswith('.py'):
            replace_in_file(os.path.join(root, file))
