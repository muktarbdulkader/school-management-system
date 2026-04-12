#!/usr/bin/env python
"""Remove null bytes from views.py"""

# Read the file and remove null bytes
with open('api/students/views.py', 'rb') as f:
    content = f.read()

# Count null bytes
null_count = content.count(b'\x00')

# Remove null bytes
cleaned = content.replace(b'\x00', b'')

# Write back
with open('api/students/views.py', 'wb') as f:
    f.write(cleaned)

print(f'Removed {null_count} null bytes from views.py')
