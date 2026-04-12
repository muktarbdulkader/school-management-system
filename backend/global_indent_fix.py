import os

def fix_indentation(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        for line in lines:
            if not line.strip():
                new_lines.append('\n')
                continue
                
            stripped = line.lstrip()
            indent_len = len(line) - len(stripped)
            
            # If indentation is not a multiple of 4, normalize it
            if indent_len % 4 != 0:
                # Most common mistake is 2 or 6 spaces
                # We round to the nearest multiple of 4
                new_indent = round(indent_len / 4) * 4
                new_lines.append(' ' * int(new_indent) + stripped)
            else:
                new_lines.append(line)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
    return False

def walk_and_fix(root_dir):
    for r, d, files in os.walk(root_dir):
        for f in files:
            if f.endswith('.py'):
                file_path = os.path.join(r, f)
                if fix_indentation(file_path):
                    pass

walk_and_fix(r'c:\Users\hp\Music\school-Management-system\backend\api')
print("Indentation normalization complete for all files in backend/api")
