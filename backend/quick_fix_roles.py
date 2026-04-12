"""
Quick fix script to assign Super_Admin role to all superuser/staff users
Run this with: python quick_fix_roles.py
"""
import sys
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')

# Add api directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, os.path.join(BASE_DIR, "api"))

django.setup()

from django.contrib.auth import get_user_model
from users.models import Role, UserRole

User = get_user_model()

def fix_roles():
    print("=" * 50)
    print("  Fixing Admin Roles")
    print("=" * 50)
    print()
    
    # Get or create Super_Admin role
    super_admin_role, created = Role.objects.get_or_create(
        name='Super_Admin',
        defaults={
            'description': 'Full system access with all permissions',
            'permissions': 'all'
        }
    )
    
    if created:
        print('✓ Created Super_Admin role')
    else:
        print('✓ Super_Admin role already exists')
    
    print()
    
    # Find all superusers and staff
    admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)
    
    print(f"Found {admin_users.count()} admin user(s):")
    for user in admin_users:
        print(f"  - {user.email} (superuser={user.is_superuser}, staff={user.is_staff})")
    
    print()
    
    assigned_count = 0
    for user in admin_users:
        # Check if user already has this role
        if not UserRole.objects.filter(user=user, role=super_admin_role).exists():
            UserRole.objects.create(
                user=user,
                role=super_admin_role
            )
            print(f'✓ Assigned Super_Admin role to {user.email}')
            assigned_count += 1
        else:
            print(f'  {user.email} already has Super_Admin role')
    
    print()
    print("=" * 50)
    if assigned_count > 0:
        print(f'✅ Successfully assigned Super_Admin role to {assigned_count} user(s)')
    else:
        print('⚠ No users needed role assignment')
    print("=" * 50)
    print()
    
    # Summary
    print('📊 Summary:')
    print(f'   Total superusers: {User.objects.filter(is_superuser=True).count()}')
    print(f'   Total staff users: {User.objects.filter(is_staff=True).count()}')
    print(f'   Total users with roles: {UserRole.objects.count()}')
    print(f'   Total roles in system: {Role.objects.count()}')
    print()
    
    # Show all user roles
    print('👥 All User Roles:')
    for ur in UserRole.objects.select_related('user', 'role'):
        print(f'   {ur.user.email} → {ur.role.name}')
    
    print()
    print("✅ Done! Now refresh your dashboard.")

if __name__ == '__main__':
    fix_roles()
