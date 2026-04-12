import os

def normalize_indentation(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace tabs with 4 spaces
        content = content.replace('\t', '    ')
        
        # Normalize redundant spaces at the end of lines
        lines = [line.rstrip() for line in content.splitlines()]
        
        normalized_content = '\n'.join(lines) + '\n'
        
        if content != normalized_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(normalized_content)
            print(f"Normalized: {file_path}")
            return True
        else:
            print(f"No changes needed for: {file_path}")
    except Exception as e:
        print(f"Failed to normalize {file_path}: {e}")
    return False

# Target file
target = r"c:\Users\hp\Music\school-Management-system\backend\api\students\views.py"
normalize_indentation(target)
