# Staff Management System

This document outlines the staff management capabilities within the Exam Management System, including the roles of Admin, Dean, and HOD.

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access. Can create staff, assign subjects, assign HOD/Dean roles, and deactivate accounts. |
| **Dean** | Can access the Admin Dashboard. Can manage staff, assign subjects, and **deactivate/activate** staff accounts. |
| **HOD** | Can access the Admin Dashboard. Can manage staff and subjects within their department. |
| **Staff** | Restricted to the Staff Portal. Can only upload questions for assigned subjects. |

## Managing Staff Accounts

### Adding New Staff
1. Navigate to the **Staff Management** tab in the Admin Dashboard.
2. Click **Add Staff**.
3. Fill in the required details (Email, Name, Username, Department).
4. Optionally assign subjects immediately.
5. Click **Create Staff Account**. An email will be sent for verification.

### Deactivating Staff (New Feature)
Admins and Deans can now deactivate staff members. This prevents them from logging into the system.

1. In the **Staff List**, locate the staff member.
2. Click the **Deactivate** button (Orange Lock icon).
3. Confirm the action.
4. The user's status will change to **Inactive** (Red badge), and they will be blocked from logging in.

To **Activate** a staff member again:
1. Click the **Activate** button (Green Unlock icon).
2. The user will regain access immediately.

### Assigning HOD/Dean Roles
1. Navigate to the **Assign HOD/Dean** tab (or button).
2. Enter the username of an *existing* staff member.
3. Select the role (**Dean** or **HOD**).
4. Enter the department.
5. Click **Assign Role**.

## Security Note
- **Inactive** users cannot bypass the login screen.
- Only authorized accounts (Admin/Dean) can toggle account status.
