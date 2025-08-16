# 1. REGISTER USER
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "phone": "+1234567890",
    "role": "user",
    "sports": ["football", "basketball"]
  }'

# 2. LOGIN USER
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'

# 3. GET USER PROFILE (Replace TOKEN with actual access token)
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer TOKEN"

# 4. UPDATE USER PROFILE
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "+1234567891",
    "sports": ["football", "tennis"]
  }'

# 5. CHANGE PASSWORD
curl -X PUT http://localhost:3000/api/user/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }'

# 6. REFRESH TOKEN
curl -X POST http://localhost:3000/api/user/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'

# 7. LOGOUT
curl -X POST http://localhost:3000/api/user/logout \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'

# 8. DEACTIVATE ACCOUNT
curl -X PUT http://localhost:3000/api/user/deactivate \
  -H "Authorization: Bearer TOKEN"

# ADMIN ENDPOINTS (Replace ADMIN_TOKEN with admin access token)

# 9. GET ALL USERS (with pagination and filters)
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=10&role=user&isActive=true&search=john" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 10. GET USER BY ID
curl -X GET http://localhost:3000/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 11. CREATE USER (Admin)
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+1234567892",
    "role": "trainer",
    "sports": ["swimming"]
  }'

# 12. UPDATE USER (Admin)
curl -X PUT http://localhost:3000/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "role": "student",
    "isActive": true
  }'

# 13. DELETE USER (Admin)
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 14. TOGGLE USER STATUS (Admin)
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID_HERE/toggle-status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 15. GET USER STATISTICS (Admin)
curl -X GET http://localhost:3000/api/admin/users/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 16. HEALTH CHECK
curl -X GET http://localhost:3000/health

# 17. REGISTER ADMIN USER (First time setup)
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "phone": "+1234567899",
    "role": "admin"
  }'