**Events Endpoints**

Public:
GET    /api/events              - Get all events (with filters)
GET    /api/events/:id          - Get event by ID
GET    /api/events?search=      - Search events

Authenticated Users:
POST   /api/events/:id/join     - Join an event
DELETE /api/events/:id/leave    - Leave an event
GET    /api/events/user/my-events - Get user's events

Admin Only:
POST   /api/events              - Create event
PUT    /api/events/:id          - Update event
DELETE /api/events/:id          - Delete event 
GET    /api/events/admin/stats  - Get event statistics
GET    /api/events/admin/all-events  - Get All events

**Admin Endpoints**

User Management:
GET    /api/admin/users
GET    /api/admin/users/stats
GET    /api/admin/users/:id
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
PATCH  /api/admin/users/:id/toggle-status

Student Management:
GET    /api/admin/students
GET    /api/admin/students/stats
GET    /api/admin/students/:id
PUT    /api/admin/students/:id
PUT    /api/admin/students/:studentId/kits/:kitId

Trainer Management:
GET    /api/admin/trainers
GET    /api/admin/trainers/stats
GET    /api/admin/trainers/:id
POST   /api/admin/trainers
PUT    /api/admin/trainers/:id
DELETE /api/admin/trainers/:id