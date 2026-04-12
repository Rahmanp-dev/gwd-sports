You are working on the existing MasterGarde frontend codebase.

Hard rules:
1. First inspect and understand the existing frontend folder structure, component patterns, routing, auth flow, state management, and reusable utilities before writing any code.
2. Do not assume the project structure. Use the current codebase as source of truth.
3. Do not break any existing working features. Only change the parts required for the requested feature.
4. All code must be production-grade, scalable, modular, and maintainable.
5. All UI must be fully responsive and work well on mobile, tablet, and desktop, with mobile and desktop being the highest priority.
6. Authentication, protected routes, and RBAC must match the backend implementation exactly.
7. Use modern best practices: clean component structure, separation of concerns, reusable hooks/utilities where appropriate, strong TypeScript typing, proper loading/error states, and safe navigation handling.
8. For every file you provide, always include:
   - the relative file path
   - whether it is a new file or an update to an existing file
   - the full code for that file
9. If a file is unchanged, do not mention it.
10. Do not give vague guidance. Give exact implementable code only.

Output format:
For each file, use this structure exactly:

File: src/path/to/file.tsx
Status: New / Updated
Code:
```tsx
<full code here>
```

Feature goal:
Implement the requested frontend feature end-to-end in the existing app, using the current architecture and conventions already present in the repository.

Additional requirements:

- Read the backend contract first if needed and align the frontend to it.
- Use correct route protection and role checks.
- Keep the UX clean, minimal, and reliable.
- Handle edge cases, invalid states, and errors properly.
- Preserve existing styling conventions unless the requested feature requires changes.
- Do not introduce unnecessary refactors.