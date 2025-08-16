# 1. CREATE EVENT (Admin only - Replace ADMIN_TOKEN with actual admin token)
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Football Championship",
    "description": "A competitive football tournament for all skill levels",
    "sport": "football",
    "startDate": "2024-12-01T10:00:00Z",
    "endDate": "2024-12-01T18:00:00Z",
    "location": "New York",
    "venue": "Central Stadium",
    "maxParticipants": 50,
    "registrationDeadline": "2024-11-25T23:59:59Z",
    "entryFee": 25.00,
    "contactInfo": {
      "name": "John Organizer",
      "phone": "+1234567890",
      "email": "organizer@example.com"
    },
    "status": "published",
    "isPublic": true,
    "registrationOpen": true,
    "tags": ["football", "championship", "competitive"],
    "requirements": "Must bring own equipment",
    "prizes": ["1st Place: $500", "2nd Place: $300", "3rd Place: $200"]
  }'

# 2. GET ALL EVENTS (Public - no auth required)
curl -X GET "http://localhost:3000/api/events?page=1&limit=10&sport=football&status=published"

# 3. GET ALL EVENTS WITH FILTERS
curl -X GET "http://localhost:3000/api/events?page=1&limit=5&sport=football&isPublic=true&registrationOpen=true&search=championship&sortBy=startDate&sortOrder=asc"

# 4. GET EVENT BY ID (Public)
curl -X GET http://localhost:3000/api/events/EVENT_ID_HERE

# 5. UPDATE EVENT (Admin only)
curl -X PUT http://localhost:3000/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Football Championship",
    "maxParticipants": 60,
    "entryFee": 30.00,
    "description": "Updated description with new rules"
  }'

# 6. DELETE EVENT (Admin only - soft delete)
curl -X DELETE http://localhost:3000/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 7. JOIN EVENT (Any authenticated user)
curl -X POST http://localhost:3000/api/events/EVENT_ID_HERE/join \
  -H "Authorization: Bearer USER_TOKEN"

# 8. LEAVE EVENT (Any authenticated user)
curl -X DELETE http://localhost:3000/api/events/EVENT_ID_HERE/leave \
  -H "Authorization: Bearer USER_TOKEN"

# 9. GET USER'S EVENTS (Authenticated user)
curl -X GET "http://localhost:3000/api/events/user/my-events?page=1&limit=10&upcoming=true" \
  -H "Authorization: Bearer USER_TOKEN"

# 10. GET EVENT STATISTICS (Admin only)
curl -X GET http://localhost:3000/api/events/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 11. ADMIN - GET ALL EVENTS (Admin panel)
curl -X GET "http://localhost:3000/api/admin/events?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 12. CREATE BASKETBALL EVENT
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basketball Skills Challenge",
    "description": "Test your basketball skills in various challenges",
    "sport": "basketball",
    "startDate": "2024-11-15T14:00:00Z",
    "location": "Los Angeles",
    "venue": "Sports Complex Arena",
    "maxParticipants": 30,
    "entryFee": 15.00,
    "contactInfo": {
      "name": "Sarah Coach",
      "phone": "+1987654321",
      "email": "sarah@sportscomplex.com"
    },
    "status": "published",
    "isPublic": true,
    "registrationOpen": true,
    "tags": ["basketball", "skills", "challenge"]
  }'

# 13. GET EVENTS BY SPORT
curl -X GET "http://localhost:3000/api/events?sport=basketball&status=published"

# 14. GET UPCOMING EVENTS
curl -X GET "http://localhost:3000/api/events?startDate=2024-11-01T00:00:00Z&sortBy=startDate&sortOrder=asc"

# 15. SEARCH EVENTS
curl -X GET "http://localhost:3000/api/events?search=championship&limit=5"

# 16. GET EVENTS BY LOCATION
curl -X GET "http://localhost:3000/api/events?location=New York"

# 17. CREATE DRAFT EVENT
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tennis Tournament Draft",
    "description": "Draft tennis tournament - details to be finalized",
    "sport": "tennis",
    "startDate": "2024-12-15T09:00:00Z",
    "location": "Miami",
    "venue": "Tennis Club",
    "contactInfo": {
      "name": "Mike Organizer",
      "phone": "+1122334455",
      "email": "mike@tennisclub.com"
    },
    "status": "draft",
    "isPublic": false,
    "registrationOpen": false
  }'

# 18. UPDATE EVENT STATUS TO PUBLISHED
curl -X PUT http://localhost:3000/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published",
    "isPublic": true,
    "registrationOpen": true
  }'

# 19. CLOSE REGISTRATION FOR EVENT
curl -X PUT http://localhost:3000/api/events/EVENT_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registrationOpen": false
  }'

# 20. GET EVENTS WITH REGISTRATION OPEN
curl -X GET "http://localhost:3000/api/events?registrationOpen=true&status=published"