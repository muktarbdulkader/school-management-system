import sys

def fix_indentation(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Specific check for line 1345-1346 (which we know is broken)
        # Academic summary (placeholder) at 1291 try:
        
        if "academic_summary = {" in line and line.startswith(' ' * 8) and not line.startswith(' ' * 12):
            # This block starts at 8 but should be 12 because it's inside the try: at 1291
            # We need to shift everything until the 'except Student.DoesNotExist:'
            j = i
            while j < len(lines) and "except Student.DoesNotExist:" not in lines[j]:
                if lines[j].strip():
                    new_lines.append(' ' * 4 + lines[j])
                else:
                    new_lines.append(lines[j])
                j += 1
            i = j
            continue
            
        new_lines.append(line)
        i += 1
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Fixed indentation in StudentViewSet.dashboard")

# Run it
fix_indentation(r"c:\Users\hp\Music\school-Management-system\backend\api\students\views.py")
