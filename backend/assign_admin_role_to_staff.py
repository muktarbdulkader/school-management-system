#!/usr/bin/env python
"""
Script to assign admin role to staff users who don't have any roles
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()

from users.models import User, Role, UserRole

def assign_admin_role_to_staff():
    """Assign admin role to all staff users who don't have any roles"""
    
    # Get or create admin role
    admin_role, created = Role.objects.get_or_create(
        name='Admin',
        defaults={'description': 'Administrator with full access'}
    )
    
    if created:
        print(f"✅ Created Admin role")
    else:
        print(f"✅ Admin role already exists")
    
    # Find all staff users without roles
    staff_users = User.objects.filter(is_staff=True)
    
    assigned_count = 0
    for user in staff_users:
        # Check if user already has roles
        if not user.userrole_set.exists():
            UserRole.objects.create(
                user=user,
                role=admin_role,
                access_level='full',
                assigned_by=None
            )
            print(f"✅ Assigned Admin role to {user.email}")
            assigned_count += 1
        else:
            print(f"ℹ️  {user.email} already has roles: {', '.join(user.roles)}")
    
    print(f"\n✅ Successfully assigned Admin role to {assigned_count} staff user(s)")
    print(f"📊 Total staff users: {staff_users.count()}")

if __name__ == '__main__':
    print("🔧 Assigning Admin role to staff users...\n")
    assign_admin_role_to_staff()
    print("\n✅ Done!")
