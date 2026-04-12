import os
import glob

apps = ['academics', 'students', 'teachers', 'schedule', 'lessontopics', 'communication', 'materials', 'blogs', 'library', 'tasks']

for app in apps:
    migrations_dir = f'api/{app}/migrations/'
    if os.path.exists(migrations_dir):
        # Delete all .py files except __init__.py
        for f in glob.glob(migrations_dir + '*.py'):
            if os.path.basename(f) != '__init__.py':
                os.remove(f)
                print(f'Deleted: {f}')
        # Clear __init__.py content
        init_file = migrations_dir + '__init__.py'
        if os.path.exists(init_file):
            with open(init_file, 'w') as f:
                f.write('# Migrations\n')
            print(f'Cleared: {init_file}')

print('Done!')
