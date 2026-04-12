#!/usr/bin/env python3
"""
Script to fix all incorrect imports in the api folder.
Changes 'from users.' to 'from users.' etc.
"""
import os
import re

# Define the replacements
REPLACEMENTS = [
    (r'^from users\.', 'from users.'),
    (r'^from students\.', 'from students.'),
    (r'^from teachers\.', 'from teachers.'),
    (r'^from academics\.', 'from academics.'),
    (r'^from schedule\.', 'from schedule.'),
    (r'^from communication\.', 'from communication.'),
    (r'^from lessontopics\.', 'from lessontopics.'),
    (r'^from library\.', 'from library.'),
    (r'^from materials\.', 'from materials.'),
    (r'^from tasks\.', 'from tasks.'),
    (r'^\s+from users\.', '            from users.'),
    (r'^\s+from students\.', '            from students.'),
    (r'^\s+from teachers\.', '            from teachers.'),
    (r'^\s+from academics\.', '            from academics.'),
]

def fix_file(filepath):
    """Fix imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        lines = content.split('\n')
        new_lines = []
        
        for line in lines:
            new_line = line
            for pattern, replacement in REPLACEMENTS:
                new_line = re.sub(pattern, replacement, new_line)
            new_lines.append(new_line)
        
        new_content = '\n'.join(new_lines)
        
        if new_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Fix all Python files in the api folder"""
    api_dir = os.path.join(os.path.dirname(__file__), 'api')
    fixed_count = 0
    
    for root, dirs, files in os.walk(api_dir):
        # Skip __pycache__ and migrations
        dirs[:] = [d for d in dirs if d not in ['__pycache__', 'migrations']]
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if fix_file(filepath):
                    fixed_count += 1
    
    print(f"\nFixed {fixed_count} files")

if __name__ == '__main__':
    main()
