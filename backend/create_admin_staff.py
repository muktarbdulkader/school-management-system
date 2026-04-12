
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from users.models import Role, RolePermission, Branch, UserRole, UserBranchAccess

User = get_user_model()


def setup_system():
    print("\n" + "="*60)
    print("🚀 SYSTEM SETUP STARTED")
    print("="*60)

    # ----------------------------
    # 1️⃣ CREATE ROLES
    # ----------------------------
    roles = {
        "admin": "Full system administrator",
        "staff": "Regular staff role"
    }

    role_objs = {}
    for role_name, desc in roles.items():
        role, _ = Role.objects.get_or_create(name=role_name, defaults={"description": desc})
        role_objs[role_name] = role
        print(f"✅ Role ensured: {role_name}")

    # ----------------------------
    # 2️⃣ ASSIGN ROLE PERMISSIONS
    # ----------------------------
    roles_permissions = {
        "admin": [
            ("user", "add_user"), ("user", "view_user"), ("user", "change_user"), ("user", "delete_user"),
            ("branch", "add_branch"), ("branch", "view_branch"), ("branch", "change_branch"), ("branch", "delete_branch"),
            ("role", "add_role"), ("role", "view_role"), ("role", "change_role"), ("role", "delete_role"),
            ("userrole", "add_userrole"), ("userrole", "view_userrole"), ("userrole", "change_userrole"), ("userrole", "delete_userrole"),
            ("rolepermission", "add_rolepermission"), ("rolepermission", "view_rolepermission"),
            ("rolepermission", "change_rolepermission"), ("rolepermission", "delete_rolepermission"),
            ("userbranchaccess", "add_userbranchaccess"), ("userbranchaccess", "view_userbranchaccess"),
        ],
        "staff": [
            ("user", "view_user"),
            ("branch", "view_branch"),
        ]
    }

    for role_name, perms in roles_permissions.items():
        role = role_objs[role_name]
        for model_name, codename in perms:
            try:
                ct = ContentType.objects.get(app_label="users", model=model_name.lower())
                perm = Permission.objects.get(codename=codename, content_type=ct)
                rp, created = RolePermission.objects.get_or_create(role=role, content_type=ct, permission=perm)
                if created:
                    print(f"  ✅ Assigned {codename} on {model_name} to {role_name}")
            except ContentType.DoesNotExist:
                print(f"⚠️ ContentType not found: {model_name}")
            except Permission.DoesNotExist:
                print(f"⚠️ Permission not found: {codename} on {model_name}")

    print("✅ Permissions assigned")

    # ----------------------------
    # 3️⃣ CREATE BRANCH
    # ----------------------------
    branch, _ = Branch.objects.get_or_create(
        name="Main Branch",
        defaults={"address": "Main Campus", "phone": "1234567890", "email": "main@example.com", "is_main": True}
    )
    print("✅ Branch ensured")

    # ----------------------------
    # 4️⃣ CREATE USERS
    # ----------------------------
    users_data = [
        {"email": "admin@example.com", "full_name": "System Admin", "password": "admin123", "role": role_objs["admin"], "is_superuser": True},
        {"email": "admin2@example.com", "full_name": "School Admin", "password": "admin123", "role": role_objs["admin"], "is_superuser": False},
        {"email": "staff@example.com", "full_name": "Office Staff", "password": "staff123", "role": role_objs["staff"], "is_superuser": False},
        {"email": "staff2@example.com", "full_name": "Support Staff", "password": "staff123", "role": role_objs["staff"], "is_superuser": False},
    ]

    for data in users_data:
        if User.objects.filter(email=data["email"]).exists():
            print(f"⚠️ Skipped: {data['email']} (already exists)")
            continue

        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            full_name=data["full_name"],
            is_active=True,
            is_staff=True,
            is_superuser=data["is_superuser"]
        )

        # Assign role
        UserRole.objects.get_or_create(user=user, role=data["role"])

        # Assign branch access
        UserBranchAccess.objects.get_or_create(user=user, branch=branch, defaults={"access_level": "full"})

        print(f"✅ Created user: {data['email']}")

    print("\n" + "="*60)
    print("🎉 SYSTEM SETUP COMPLETE")
    print("="*60)

    print("\nLogin Credentials:")
    print("Admin:")
    print("  - admin@example.com / admin123 (superuser)")
    print("  - admin2@example.com / admin123")
    print("Staff:")
    print("  - staff@example.com / staff123")
    print("  - staff2@example.com / staff123")


# Run setup
setup_system()