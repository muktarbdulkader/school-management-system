#!/usr/bin/env python
"""Reset admin user password for local development"""
import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, os.path.join(BASE_DIR, "api"))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()

from users.models import User

def reset_admin_password():
    """Reset password for admin users"""
    print("🔍 Looking for admin users...")
    
    # Find users with is_superuser or is_staff
    admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)
    
    if not admin_users.exists():
        print("❌ No admin users found!")
        print("Creating a new superuser...")
        
        # Create a new superuser
        email = input("Enter email: ").strip()
        password = input("Enter password: ").strip()
        full_name = input("Enter full name: ").strip()
        
        user = User.objects.create_superuser(
            email=email,
            password=password,
            full_name=full_name
        )
        print(f"✅ Superuser created: {user.email}")
        return
    
    print(f"\n📋 Found {admin_users.count()} admin user(s):")
    for idx, user in enumerate(admin_users, 1):
        print(f"  {idx}. {user.email} (Staff: {user.is_staff}, Super: {user.is_superuser})")
    
    # Reset password for all or specific user
    choice = input("\nReset password for (number or 'all'): ").strip().lower()
    
    if choice == 'all':
        users_to_reset = admin_users
    else:
        try:
            idx = int(choice) - 1
            users_to_reset = [list(admin_users)[idx]]
        except (ValueError, IndexError):
            print("❌ Invalid choice")
            return
    
    new_password = input("Enter new password: ").strip()
    
    for user in users_to_reset:
        user.set_password(new_password)
        user.save()
        print(f"✅ Password reset for: {user.email}")
    
    print("\n🎉 Done! You can now login with the new password.")

if __name__ == '__main__':
    reset_admin_password()
