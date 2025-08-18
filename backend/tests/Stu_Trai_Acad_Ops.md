# ========================
# ACADEMY APIS
# ========================

# 1. CREATE ACADEMY (Admin only)
curl -X POST http://localhost:3000/api/academy \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Sports Academy",
    "description": "Premier sports training facility offering world-class coaching",
    "location": "Los Angeles",
    "address": "123 Sports Street, LA, CA 90210",
    "sports": ["football", "basketball", "tennis"],
    "fees": {
      "monthly": 150.00,
      "quarterly": 400.00,
      "yearly": 1500.00
    },
    "contactInfo": {
      "name": "John Smith",
      "phone": "+1234567890",
      "email": "contact@elitesports.com"
    },
    "facilities": ["Swimming Pool", "Gym", "Basketball Court", "Tennis Courts"],
    "timings": {
      "opening": "06:00",
      "closing": "22:00",
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    },
    "capacity": 200,
    "images": ["https://example.com/academy1.jpg", "https://example.com/academy2.jpg"]
  }'

# 2. GET ALL ACADEMIES (Public)
curl -X GET "http://localhost:3000/api/academy?page=1&limit=10"

# 3. GET ACADEMIES BY LOCATION
curl -X GET "http://localhost:3000/api/academy?location=Los Angeles&sport=football"

# 4. SEARCH ACADEMIES
curl -X GET "http://localhost:3000/api/academy?search=elite&page=1&limit=5"

# 5. GET ACADEMY BY ID (Public)
curl -X GET http://localhost:3000/api/academy/ACADEMY_ID_HERE

# 6. UPDATE ACADEMY (Admin only)
curl -X PUT http://localhost:3000/api/academy/ACADEMY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Sports Academy Updated",
    "capacity": 250,
    "fees": {
      "monthly": 160.00,
      "quarterly": 450.00,
      "yearly": 1600.00
    }
  }'

# 7. DELETE ACADEMY (Admin only)
curl -X DELETE http://localhost:3000/api/academy/ACADEMY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# ========================
# STUDENT APIS
# ========================

# 8. CREATE STUDENT PROFILE
curl -X POST http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sports": ["football", "basketball"],
    "level": "beginner",
    "medicalInfo": {
      "allergies": ["peanuts", "shellfish"],
      "medications": ["inhaler"],
      "emergencyContact": {
        "name": "Jane Doe",
        "phone": "+1987654321",
        "relation": "mother"
      }
    }
  }'

# 9. GET STUDENT PROFILE
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer STUDENT_TOKEN"

# 10. JOIN ACADEMY
curl -X POST http://localhost:3000/api/student/join-academy \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academyId": "ACADEMY_ID_HERE"
  }'

# 11. GET STUDENT ATTENDANCE
curl -X GET "http://localhost:3000/api/student/attendance?page=1&limit=10&fromDate=2024-01-01&toDate=2024-12-31" \
  -H "Authorization: Bearer STUDENT_TOKEN"

# 12. GET STUDENT PERFORMANCE
curl -X GET "http://localhost:3000/api/student/performance?sport=football&category=fitness" \
  -H "Authorization: Bearer STUDENT_TOKEN"

# 13. REQUEST KIT
curl -X POST http://localhost:3000/api/student/request-kit \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kitName": "Football Training Kit"
  }'

# 14. GET STUDENT KITS
curl -X GET http://localhost:3000/api/student/kits \
  -H "Authorization: Bearer STUDENT_TOKEN"

# 15. PAY FEES
curl -X POST http://localhost:3000/api/student/pay-fees \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "period": "monthly",
    "transactionId": "TXN123456789"
  }'

# ========================
# TRAINER APIS
# ========================

# 16. CREATE TRAINER PROFILE (Admin only)
curl -X POST http://localhost:3000/api/trainer/profile \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "sports": ["football", "fitness"],
    "specializations": ["Youth Training", "Fitness Coaching"],
    "qualifications": [{
      "certification": "FIFA Level 1 Coaching",
      "issuedBy": "FIFA",
      "issuedDate": "2023-01-15T00:00:00Z",
      "expiryDate": "2026-01-15T00:00:00Z"
    }],
    "experience": [{
      "organization": "Local Sports Club",
      "position": "Youth Coach",
      "startDate": "2022-01-01T00:00:00Z",
      "endDate": "2023-12-31T00:00:00Z",
      "description": "Coached youth football teams aged 12-16"
    }],
    "hourlyRate": 50.00,
    "availability": {
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "timeSlots": [{
        "start": "09:00",
        "end": "17:00"
      }]
    }
  }'

# 17. GET TRAINER PROFILE
curl -X GET http://localhost:3000/api/trainer/profile \
  -H "Authorization: Bearer TRAINER_TOKEN"

# 18. GET TRAINER STUDENTS
curl -X GET "http://localhost:3000/api/trainer/students?page=1&limit=10&level=beginner&search=john" \
  -H "Authorization: Bearer TRAINER_TOKEN"

# 19. ADD STUDENT TO TRAINER
curl -X POST http://localhost:3000/api/trainer/add-student \
  -H "Authorization: Bearer TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_USER_ID_HERE"
  }'

# 20. MARK ATTENDANCE
curl -X POST http://localhost:3000/api/trainer/mark-attendance \
  -H "Authorization: Bearer TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_USER_ID_HERE",
    "date": "2024-11-20T00:00:00Z",
    "present": true,
    "remarks": "Excellent participation in training"
  }'

# 21. GET STUDENT ATTENDANCE (By Trainer)
curl -X GET "http://localhost:3000/api/trainer/student/STUDENT_USER_ID_HERE/attendance?fromDate=2024-11-01&toDate=2024-11-30" \
  -H "Authorization: Bearer TRAINER_TOKEN"

# 22. ADD PERFORMANCE RECORD
curl -X POST http://localhost:3000/api/trainer/add-performance \
  -H "Authorization: Bearer TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_USER_ID_HERE",
    "sport": "football",
    "score": 85,
    "maxScore": 100,
    "remarks": "Great improvement in ball control and passing accuracy",
    "category": "technique"
  }'

# ========================
# ADMIN STUDENT MANAGEMENT
# ========================

# 23. GET ALL STUDENTS (Admin)
curl -X GET "http://localhost:3000/api/admin/students?page=1&limit=10&level=beginner&academyId=ACADEMY_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 24. GET STUDENT BY ID (Admin)
curl -X GET http://localhost:3000/api/admin/students/STUDENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 25. UPDATE STUDENT (Admin)
curl -X PUT http://localhost:3000/api/admin/students/STUDENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "intermediate",
    "sports": ["football", "basketball", "tennis"],
    "trainerId": "TRAINER_USER_ID_HERE"
  }'

# 26. UPDATE KIT STATUS (Admin)
curl -X PUT http://localhost:3000/api/admin/students/STUDENT_ID_HERE/kits/KIT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "delivered",
    "cost": 75.00
  }'

# 27. GET STUDENT STATISTICS (Admin)
curl -X GET http://localhost:3000/api/admin/students/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# ========================
# ADMIN ACADEMY MANAGEMENT
# ========================

# 28. GET ALL ACADEMIES (Admin)
curl -X GET "http://localhost:3000/api/admin/academies?page=1&limit=10&location=Los Angeles" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 29. GET ACADEMY BY ID (Admin)
curl -X GET http://localhost:3000/api/admin/academies/ACADEMY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 30. CREATE ACADEMY (Admin)
curl -X POST http://localhost:3000/api/admin/academies \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Sports Academy",
    "description": "Premier sports training facility",
    "location": "Los Angeles",
    "address": "123 Sports Street, LA, CA 90210",
    "sports": ["football", "basketball"],
    "fees": {
      "monthly": 150.00,
      "quarterly": 400.00,
      "yearly": 1500.00
    },
    "contactInfo": {
      "name": "John Smith",
      "phone": "+1234567890",
      "email": "contact@elitesports.com"
    },
    "timings": {
      "opening": "06:00",
      "closing": "22:00",
      "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"]
    },
    "capacity": 200
  }'

# 31. UPDATE ACADEMY (Admin)
curl -X PUT http://localhost:3000/api/admin/academies/ACADEMY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "capacity": 250,
    "fees": {
      "monthly": 160.00
    }
  }'

# 32. DELETE ACADEMY (Admin)
curl -X DELETE http://localhost:3000/api/admin/academies/ACADEMY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# ========================
# ADMIN TRAINER MANAGEMENT
# ========================

# 33. CREATE TRAINER PROFILE (Admin)
curl -X POST http://localhost:3000/api/admin/trainers \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "sports": ["football", "fitness"],
    "specializations": ["Youth Training"]
  }'

# 34. GET ALL TRAINERS (Admin)
curl -X GET "http://localhost:3000/api/admin/trainers?page=1&limit=10&sport=football" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 35. GET TRAINER STATISTICS (Admin)
curl -X GET http://localhost:3000/api/admin/trainers/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 36. GET TRAINER BY ID (Admin)
curl -X GET http://localhost:3000/api/admin/trainers/TRAINER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 37. UPDATE TRAINER (Admin)
curl -X PUT http://localhost:3000/api/admin/trainers/TRAINER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sports": ["football", "basketball", "fitness"],
    "hourlyRate": 60.00,
    "specializations": ["Youth Training", "Advanced Techniques"]
  }'

# 38. DELETE TRAINER (Admin)
curl -X DELETE http://localhost:3000/api/admin/trainers/TRAINER_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# ========================
# INTEGRATION TESTING
# ========================

# 28. FULL WORKFLOW TEST - Register User, Create Student Profile, Join Academy
# First register a new user
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Student",
    "email": "teststudent@example.com",
    "password": "Password123!",
    "phone": "+1234567890",
    "role": "student"
  }'

# Login to get token (save the token from response)
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "password": "Password123!"
  }'

# Create student profile with the token
curl -X POST http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer NEW_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sports": ["football"],
    "level": "beginner"
  }'

# Join an academy
curl -X POST http://localhost:3000/api/student/join-academy \
  -H "Authorization: Bearer NEW_STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "academyId": "ACADEMY_ID_HERE"
  }'

# 29. TRAINER WORKFLOW - Create Trainer, Add Student, Mark Attendance
# Admin creates trainer profile
curl -X POST http://localhost:3000/api/trainer/profile \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "TRAINER_USER_ID",
    "sports": ["football"],
    "specializations": ["Youth Training"]
  }'

# Trainer adds student
curl -X POST http://localhost:3000/api/trainer/add-student \
  -H "Authorization: Bearer TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_USER_ID"
  }'

# Trainer marks attendance
curl -X POST http://localhost:3000/api/trainer/mark-attendance \
  -H "Authorization: Bearer TRAINER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_USER_ID",
    "date": "2024-11-20T00:00:00Z",
    "present": true
  }'

# 30. GET COMPREHENSIVE REPORTS
# Get all academies with students
curl -X GET "http://localhost:3000/api/academy" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get trainer's students performance
curl -X GET "http://localhost:3000/api/trainer/students" \
  -H "Authorization: Bearer TRAINER_TOKEN"

# Get student's complete profile with attendance and performance
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer STUDENT_TOKEN"