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
        print(f"Indentation normalized for {file_path}")
        return True
    except Exception as e:
        print(f"Error: {e}")
    return False

fix_indentation(r"c:\Users\hp\Music\school-Management-system\backend\api\students\views.py")
