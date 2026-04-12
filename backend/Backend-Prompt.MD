You are building a production-grade backend API for the MasterGarde application.

Tech Stack:
- Node.js + Express + TypeScript
- MongoDB (Mongoose)

Objective:
Implement scalable, secure REST APIs with proper architecture, RBAC, filtering, sorting, and pagination.

---

### 1. Architecture (STRICT)

Follow clean modular structure:

- src/
  - controllers/
  - schemas/
  - routers/
  - middlewares/
  - utils/
  - types/
  - config/

---

### 2. Entities 

- User
- Student
- Trainer
- Event
- Fees / Payment
- Academy
- Attendance
- Kit
- Performance

Each must support FULL CRUD:

Endpoints:
- POST   /entity
- GET    /entity
- GET    /entity/:id
- PUT    /entity/:id
- DELETE /entity/:id

---

### 3. Advanced Query Features (MANDATORY)

For all `GET /entity` endpoints:

Support:

Filtering:
- ?field=value
- ?field[gte]=value, ?field[lte]=value

Sorting:
- ?sort=field,-createdAt

Pagination:
- ?page=1&limit=10

Search:
- ?search=keyword (apply on relevant fields)

Implementation:
- Build a reusable query utility (DO NOT duplicate logic)

---

### 4. RBAC (Role-Based Access Control)

Roles:
- ADMIN
- USER
- STUDENT
- TRAINER

Rules:

- ADMIN:
  - Full access to all resources
  - Can create/update/delete Events, Students, Trainers

- STUDENT:
  - Can read own data
  - Can view & join events
  - Can initiate payments
  - Can view their performance
  - Can view their attendance
  - Can join events

- TRAINER:
  - Can read own data
  - Can view & join events
  - Can view academy students
  - Can view and write student performance

Middleware Requirements:
- `authenticate` → verifies JWT
- `authorize(roles: Role[])` → restricts access

STRICT:
- No route should rely on frontend for authorization
- All checks must be backend enforced

---

### 5. Security (NON-NEGOTIABLE)

- Use environment variables for secrets
- Validate all inputs - use Zod
- Sanitize inputs to prevent injection
- Rate limiting middleware
- Centralized error handling
- Never expose sensitive fields (passwords, tokens)

---

### 6. Error Handling

- Standard response format:

Success:
{
  success: true,
  data,
  message
}

Error:
{
  success: false,
  error,
  message
}

- Use HTTP status codes properly

---

### 7. Logging & Scalability

- Add request logging middleware
- Structure code to be horizontally scalable
- Avoid tight coupling between modules

---

### 8. Payments (Basic Structure Only)

- Endpoint to create payment record
- Store:
  - userId
  - amount
  - status
  - transactionId

(No gateway integration here — just structure)

---

### 9. Output Requirements

Provide:

1. Models (schemas)
2. Controllers
3. Services
4. Repositories
5. Middlewares (auth + RBAC + error handler)
6. Routes (fully wired)
7. Query utility (filter/sort/pagination)
8. Example `.env` structure

---

### 10. Testing (MANDATORY)

Provide CURL commands for:

- Auth (login / token usage)
- CRUD for each entity
- Filtering / sorting / pagination examples
- RBAC failure cases (e.g., student trying admin action)

---

### Constraints

- NO shortcuts
- NO hardcoded values
- NO mixing of concerns
- Code must be clean, modular, and production-ready

---

Goal:
A scalable backend foundation that can handle real-world usage, enforce strict RBAC, and support complex queries without refactoring.