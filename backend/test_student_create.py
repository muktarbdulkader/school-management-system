import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mald_sms.settings')
django.setup()

from students.serializers import StudentSerializer
from users.models import User
from academics.models import Class, Section

# Test data similar to what frontend might send
test_data = {
    'full_name': 'Test Student',
    'email': 'teststudent@example.com',
    'password': 'student123',
    'gender': 'Male',
    'date_of_birth': '2010-01-01',
    'citizenship': 'Test Country',
    'family_status': 'Test Status',
    'family_residence': 'Test Residence',
}

print("Test data:", test_data)
print("\nChecking what's required by serializer...")

# Try to see what fields are required
serializer = StudentSerializer(data={})
serializer.is_valid()
print("\nValidation errors with empty data:")
print(serializer.errors)

# Now try with user field
print("\n\nTrying to create with minimal data (user field)...")
try:
    # First check if we have any users
    user_count = User.objects.count()
    print(f"Total users in database: {user_count}")
    
    if user_count > 0:
        first_user = User.objects.first()
        print(f"Using first user: {first_user.email}")
        
        serializer = StudentSerializer(data={'user': first_user.id})
        if serializer.is_valid():
            print("Valid with just user field!")
        else:
            print("Validation errors:")
            print(serializer.errors)
    
    # Check classes and sections
    print(f"\nTotal classes: {Class.objects.count()}")
    print(f"Total sections: {Section.objects.count()}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
