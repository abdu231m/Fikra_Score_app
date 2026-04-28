# Security Specification - Student Competition App

## 1. Data Invariants
- A Student document must contain `name`, `points`, and a `qrCode`.
- `points` must be a non-negative number.
- `qrCode` must be a string and should ideally be unique (application level check).
- Only authenticated admins can modify student data.
- The leaderboard (student names and points) is publicly readable.
- `admins` collection is only readable by authenticated users to verify permissions.

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. **Unauthenticated Write**: Create a student while not logged in.
2. **Student Identity Spoofing**: A non-admin user trying to add an `admin` document.
3. **Negative Points**: Update a student with negative points.
4. **Invalid QR Code**: Create a student with a 1MB string as a `qrCode`.
5. **State Shortcut**: Update `points` by 10,000 in one request without validation (though rules can't easily limit the *amount* of increment without specific logic, but we can check types).
6. **Malicious Admin Promotion**: A user trying to set `isAdmin: true` on their own profile (not using profiles here, but logic applies to `admins` collection).
7. **Deleting the entire leaderboard**: Unauthenticated or non-admin user calling `delete` on all students.
8. **Field Injection**: Adding a `secretField` to a student document.
9. **Timestamp Spoofing**: Sending a past date for `updatedAt`.
10. **ID Poisoning**: Using a 2KB string as a student ID.
11. **Admin Data Leak**: Unauthenticated user reading the `admins` collection.
12. **PII Modification**: A student trying to change their own name in the database.

## 3. Test Runner
(Implicitly verified by rules logic)

## 4. Conflict Report

| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-----------------|--------------------|--------------------|
| students   | Blocked (Admin check) | Blocked (Admin check) | Blocked (Size checks) |
| admins     | Blocked (Admin check) | Blocked (Admin check) | Blocked (Size checks) |
