TODO: 

P1:
- [ ] delete trainer / student - deactivate instead of delete -> soft delete -> deactivate their user account. So make sure that they can't login
- [ ] Admin can reactivate trainer / student 

- [ ] Functional Student Dashboard - /mgfc/student
- [ ] Functional Trainer Dashboard - /mgfc/trainer
- [ ] if (!studentProfile) in frontend\src\components\user\student\StudentProfile.tsx fix this
- [ ] Create connection between user profile and their profiles - should easily navigate to student/trainer profile from user profile  -> in the profile page only have a tab to switch between dashboard and the profile 
- [ ] Student functionalities - check what all actions are present and what needs to be added
- [ ] show if the student is verified or not in the profile
- [ ] Trainer functionalities - check what all actions are present and what needs to be added
- [ ] Student, trainer interactions - check the flow
- [ ] Student, trainer, admin interactions - check the flow
- [ ] Centralized login and logout marker on top right corner
- [ ] Centralized my profile and my dashboard marker on top right corner

- [ ] Revamp landing page 
- [ ] Homepage Customization
- [ ] In football page - promote MGFC and link to its page
- [ ] Fix Admin Dashboard - some errors
- [ ] Refresh token logic in frontend
- [ ] Handle Existing Token in register pages and redirect them directly
- [ ] Check edit student - it is misbehaving
- [ ] Do something about the "inactive" users / trainers / students / academies 

P2:
- [ ] Frontend logging
- [ ] Soft delete When leaving events
- [ ] refresh token - what is it and how to implement
- [ ] improve isActive in events
- [ ] Migrate data folder to utils/constants
- [ ] Update the landing page details
- [ ] Add events agenda - in event management compone- like explaining all options
- [ ] Forgot password, reset password 
- [ ] Implement permanent delete of student / trainer by admin
- [ ] Take care of placeholders in forms 

P3: 
- [ ] Can we use MCP or some auto prompt like thing to automate prompts? like prompt engineering but automated
- [ ] Dockerize the application
- [ ] Do we hide the info of private (inactive) events? - http://localhost:5173/events/69409c9d306af5ffab0e1a5b
- [ ] event re-activation needed?
- [ ] fix build warnings

PROD:
- [ ] Disable console logs in production
- [ ] Optimize the build for production
- [ ] Add SEO tags to the pages
- [ ] Add meta descriptions
- [ ] Disable dev tools in production
- [ ] Add proper error handling and logging
- [ ] Optimize images and assets
- [ ] Implement code splitting and lazy loading
- [ ] Disable admin signup in production
- [ ] Implement security best practices

Done ✅

- [x] Implement user APIs
- [x] Implement admin APIs
- [x] What prettier does
- [x] Check if the tsconfig cge cause any issue after changing 
- [x] Add Landing page 
- [x] Add multiple pages 
- [x] Update the landing page components and make them more modular
- [x] MgMun page
- [x] Add user login 
- [x] Add student register
- [x] Add profile page for student - basically use the /user/profile page and update it for different use
- [x] Add profile page for trainer - basically use the /user/profile page and update it for different use
- [x] Fix the build issue 
- [x] What ESLINT does
- [x] Change the JWT token and then check app working with new users  
- [x] Events page - show the status properly - ongoing, upcoming, completed 
- [x] Events page - proper error handling - can't register when ongoing, upcoming, completed 
- [x] Events page - event registration
- [x] Fix Event Edit page - event is active
- [x] Better filters in events page
- [x] Fix npm builds
- [x] Add trainer register - By Admin -> Create, View, View By ID, Delete
- [x] Complete Student Login , Trainer Login, and their pages
- [x] Fix the Trainer Management page - fix filter
- [x] Fix Edit Trainer -> multi-select sports and specializations 
- [x] Fix Build errors in frontend after adding Trainer Management
- [x] In trainer create form - mark * for required fields
- [x] In trainer create form - show/hide password functionality
- [x] In trainer edit - make sure ntg is empty while editing like hourly rate as blank
- [x] Validation in trainer register form - unique email, phone, password strength - show the error from user APIs response 
- [x] trainer profile was able to snuck into /admin -> fix that 
- [x] Add Edit Student Profile in F
- [x] Add Edit Trainer Profile in F 
- [x] Privacy Policy and Terms and Conditions pages
- [x] 404 Page
- [x] Contact Us Page
- [x] About Us Page
- [x] Integrate Academy to Admin Panel