## ADMIN STUDENT OPS

### GET ALL STUDENTS
GET http://localhost:3000/api/admin/students

Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9xxxxxxxxxxxxxxx

{
    "success": true,
    "data": {
        "students": [
            {
                "_id": "68a3376874f386a3a7ea126a",
                "userId": "68a3375174f386a3a7ea1265",
                "academyId": "68a337d874f386a3a7ea1273",
                "trainerId": "68a33c1171f5b7e03e9e70be",
                "enrollmentDate": "2025-08-18T14:25:52.963Z",
                "totalFeesPaid": 150,
                "outstandingFees": 0,
                "sports": [
                    "football",
                    "basketball"
                ],
                "level": "beginner",
                "medicalInfo": {
                    "allergies": [
                        "peanuts"
                    ],
                    "medications": [
                        "inhaler"
                    ],
                    "emergencyContact": {
                        "name": "Jane Doe",
                        "phone": "+1987654321",
                        "relation": "mother"
                    }
                },
                "isActive": true,
                "feePayments": [
                    {
                        "amount": 150,
                        "paymentDate": "2025-08-18T14:34:41.819Z",
                        "period": "monthly",
                        "status": "paid",
                        "transactionId": "TXN123456789",
                        "_id": "68a33a0174f386a3a7ea128f"
                    }
                ],
                "attendance": [],
                "kits": [
                    {
                        "kitName": "Football Training Kit",
                        "status": "requested",
                        "requestedAt": "2025-08-18T14:29:01.403Z",
                        "deliveredAt": null,
                        "_id": "68a338ad74f386a3a7ea1287"
                    }
                ],
                "performance": [],
                "createdAt": "2025-08-18T14:23:36.086Z",
                "updatedAt": "2025-08-18T14:54:04.105Z",
                "__v": 2,
                "user": {
                    "_id": "68a3375174f386a3a7ea1265",
                    "name": "Student Doe",
                    "email": "stu@stu.com",
                    "password": "$2b$12$/ujrh0OP/5kCeanXF55BBun.BHXtdznvtRTThSTbMP0ibxwg0Cuue",
                    "phone": "+1234567890",
                    "role": "student",
                    "sports": [
                        "football",
                        "basketball"
                    ],
                    "refreshTokens": [
                        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGEzMzc1MTc0ZjM4NmEzYTdlYTEyNjUiLCJlbWFpbCI6InN0dUBzdHUuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NTU1MjY5OTQsImV4cCI6MTc1NjEzMTc5NH0.L-79s-CHxPYGKjgVFZIs3rHl9cx7mPrZPWNHYxnCyVg"
                    ],
                    "isActive": true,
                    "lastLogin": null,
                    "createdAt": "2025-08-18T14:23:13.149Z",
                    "updatedAt": "2025-08-18T14:23:36.213Z",
                    "__v": 1
                },
                "academy": [
                    {
                        "_id": "68a337d874f386a3a7ea1273",
                        "name": "Elite Sports Academy",
                        "description": "Premier sports training facility offering world-class coaching",
                        "location": "Los Angeles",
                        "address": "123 Sports Street, LA, CA 90210",
                        "sports": [
                            "football",
                            "basketball",
                            "tennis"
                        ],
                        "trainers": [],
                        "students": [
                            "68a3375174f386a3a7ea1265"
                        ],
                        "fees": {
                            "monthly": 150,
                            "quarterly": 400,
                            "yearly": 1500
                        },
                        "contactInfo": {
                            "name": "John Smith",
                            "phone": "+1234567890",
                            "email": "contact@elitesports.com"
                        },
                        "facilities": [
                            "Swimming Pool",
                            "Gym",
                            "Basketball Court",
                            "Tennis Courts"
                        ],
                        "timings": {
                            "opening": "06:00",
                            "closing": "22:00",
                            "workingDays": [
                                "monday",
                                "tuesday",
                                "wednesday",
                                "thursday",
                                "friday",
                                "saturday"
                            ]
                        },
                        "capacity": 200,
                        "images": [
                            "https://example.com/academy1.jpg",
                            "https://example.com/academy2.jpg"
                        ],
                        "isActive": true,
                        "createdBy": "689f4a24d92f8c5fc2cff532",
                        "createdAt": "2025-08-18T14:25:28.758Z",
                        "updatedAt": "2025-08-18T14:25:53.040Z",
                        "__v": 1
                    }
                ],
                "trainer": [
                    {
                        "_id": "68a33c1171f5b7e03e9e70be",
                        "name": "Trainer Doe",
                        "email": "trainer@mg.com",
                        "password": "$2b$12$AuElWhBiyAGBkHvm7AwJseZKPW1ySCDbqpF6wz5wvtx0UTr0A7rXa",
                        "phone": "1234567890",
                        "role": "trainer",
                        "sports": [
                            "football",
                            "basketball"
                        ],
                        "refreshTokens": [
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGEzM2MxMTcxZjViN2UwM2U5ZTcwYmUiLCJlbWFpbCI6InRyYWluZXJAbWcuY29tIiwicm9sZSI6InRyYWluZXIiLCJpYXQiOjE3NTU1MjgyMDksImV4cCI6MTc1NjEzMzAwOX0.gyoH-FIIdpo79MDM-z7NUQKJ_bHA_3KfojI_PEaiL1E",
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGEzM2MxMTcxZjViN2UwM2U5ZTcwYmUiLCJlbWFpbCI6InRyYWluZXJAbWcuY29tIiwicm9sZSI6InRyYWluZXIiLCJpYXQiOjE3NTU1Mjg1ODYsImV4cCI6MTc1NjEzMzM4Nn0.7kvUoe2GTY-T07HVZZ3gEp7_8YI4AWe-9sJ6JqAepu4"
                        ],
                        "isActive": true,
                        "lastLogin": "2025-08-18T14:49:47.029Z",
                        "createdAt": "2025-08-18T14:43:29.418Z",
                        "updatedAt": "2025-08-30T08:42:41.969Z",
                        "__v": 2
                    }
                ]
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 1,
            "totalStudents": 1,
            "hasNextPage": false,
            "hasPrevPage": false
        }
    }
}

### GET STUDENT BY ID
GET http://localhost:3000/api/admin/students/68a3376874f386a3a7ea126a
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9xxxxxxxxx

{
    "success": true,
    "data": {
        "student": {
            "medicalInfo": {
                "emergencyContact": {
                    "name": "Jane Doe",
                    "phone": "+1987654321",
                    "relation": "mother"
                },
                "allergies": [
                    "peanuts"
                ],
                "medications": [
                    "inhaler"
                ]
            },
            "_id": "68a3376874f386a3a7ea126a",
            "userId": {
                "_id": "68a3375174f386a3a7ea1265",
                "name": "Student Doe",
                "email": "stu@stu.com",
                "phone": "+1234567890"
            },
            "academyId": {
                "_id": "68a337d874f386a3a7ea1273",
                "name": "Elite Sports Academy",
                "location": "Los Angeles"
            },
            "trainerId": {
                "_id": "68a33c1171f5b7e03e9e70be",
                "name": "Trainer Doe",
                "email": "trainer@mg.com"
            },
            "enrollmentDate": "2025-08-18T14:25:52.963Z",
            "totalFeesPaid": 150,
            "outstandingFees": 0,
            "sports": [
                "football",
                "basketball"
            ],
            "level": "beginner",
            "isActive": true,
            "feePayments": [
                {
                    "amount": 150,
                    "paymentDate": "2025-08-18T14:34:41.819Z",
                    "period": "monthly",
                    "status": "paid",
                    "transactionId": "TXN123456789",
                    "_id": "68a33a0174f386a3a7ea128f"
                }
            ],
            "attendance": [],
            "kits": [
                {
                    "kitName": "Football Training Kit",
                    "status": "requested",
                    "requestedAt": "2025-08-18T14:29:01.403Z",
                    "deliveredAt": null,
                    "_id": "68a338ad74f386a3a7ea1287"
                }
            ],
            "performance": [],
            "createdAt": "2025-08-18T14:23:36.086Z",
            "updatedAt": "2025-08-18T14:54:04.105Z"
        }
    }
}

### UPDATE STUDENT

PUT http://localhost:3000/api/admin/students/68a3376874f386a3a7ea126a
Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9xxxxx
Req Body 
{
    "level": "intermediate",
    "sports": ["football", "basketball", "tennis"]
}

Response: 
{
    "success": true,
    "message": "Student updated successfully",
    "data": {
        "student": {
            "medicalInfo": {
                "emergencyContact": {
                    "name": "Jane Doe",
                    "phone": "+1987654321",
                    "relation": "mother"
                },
                "allergies": [
                    "peanuts"
                ],
                "medications": [
                    "inhaler"
                ]
            },
            "_id": "68a3376874f386a3a7ea126a",
            "userId": {
                "_id": "68a3375174f386a3a7ea1265",
                "name": "Student Doe",
                "email": "stu@stu.com"
            },
            "academyId": "68a337d874f386a3a7ea1273",
            "trainerId": "68a33c1171f5b7e03e9e70be",
            "enrollmentDate": "2025-08-18T14:25:52.963Z",
            "totalFeesPaid": 150,
            "outstandingFees": 0,
            "sports": [
                "football",
                "basketball",
                "tennis"
            ],
            "level": "intermediate",
            "isActive": true,
            "feePayments": [
                {
                    "amount": 150,
                    "paymentDate": "2025-08-18T14:34:41.819Z",
                    "period": "monthly",
                    "status": "paid",
                    "transactionId": "TXN123456789",
                    "_id": "68a33a0174f386a3a7ea128f"
                }
            ],
            "attendance": [],
            "kits": [
                {
                    "kitName": "Football Training Kit",
                    "status": "requested",
                    "requestedAt": "2025-08-18T14:29:01.403Z",
                    "deliveredAt": null,
                    "_id": "68a338ad74f386a3a7ea1287"
                }
            ],
            "performance": [],
            "createdAt": "2025-08-18T14:23:36.086Z",
            "updatedAt": "2025-08-30T22:48:34.277Z"
        }
    }
}