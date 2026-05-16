TODO: 

P0: 

- [ ] Performance Metrics: tactical, technical, SSG (Small Sided Games), and match play
- [ ] The metrics not showing up in Trainer Page during the performance add to the student
- [ ] Add View Student Performance in Trainer Page 
- [ ] Add View Student Fees in Trainer Page 
- [ ] Add View Student Kits in Trainer Page 
- [ ] Add View Student Attendance in Trainer Page 
- [ ] Make the academies names dynamic - like applying the name across the application  
- [ ] Student, trainer, admin interactions - check the flow
- [ ] Attendance Management - Trainer can mark attendance of students under him for an event; 
- [ ] Fees Management - Admin can add fees details of students under an academy
- [ ] Event Payment invoice 
- [ ] Fee Payment invoice 
- [ ] Too many authentication attempts, please try again later - comes up on 1st time only 

P1:

- [ ] only student can access student dashboard; only trainer can access trainer dashboard
- [ ] if (!studentProfile) in frontend\src\components\user\student\StudentProfile.tsx fix / check this
- [ ] Check view student - it is misbehaving - failed to load student profile in admin panel
- [ ] Check edit student in admin panel
- [ ] back to home isnt trigering the animation
- [ ] Academy Expansion: The system must support five new branches starting in February (locations mentioned include Mumbai, Punjab, Chennai, and Bangalore).
- [ ] Centralized Domain: All branches should be managed under one domain rather than separate websites

P1.5:

- [ ] In football page - promote MGFC and link to its page
- [ ] Fix Admin Dashboard - some errors -> check users section and students section
- [ ] Refresh token logic in frontend
- [ ] Handle Existing Token in register pages and redirect them directly
- [ ] show if the student is verified or not in the profile
- [ ] Do something about the "inactive" users / trainers / students / academies -> deactivate instead of delete -> soft delete -> deactivate their user account. So make sure that they can't login
- [ ] Admin can reactivate trainer / student 
- [ ] check responsive UI for all pages in mobile, tablet
- [ ] remove change password from edit user

P2:

- [ ] Soft delete When leaving events
- [ ] refresh token - what is it and how to implement
- [ ] improve isActive in events
- [ ] Add events agenda - in event management component - like explaining all options
- [ ] Forgot password, reset password 
- [ ] Implement permanent delete of student / trainer by admin
- [ ] can we make this better? const refreshToken = localStorage.getItem("mg_refresh_token");

P3: 

- [ ] favicon 
- [ ] Can we use MCP or some auto prompt like thing to automate prompts? like prompt engineering but automated
- [ ] Dockerize the application
- [ ] CI / CD pipeline for automatic deployment
- [ ] Do we hide the info of private (inactive) events? - http://localhost:5173/events/69409c9d306af5ffab0e1a5b
- [ ] event re-activation needed?
- [ ] fix build warnings
- [ ] remove unused code
- [ ] remove mock data

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
- [ ] Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.

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
- [x] Student functionalities - check what all actions are present and what needs to be added
- [x] Trainer functionalities - check what all actions are present and what needs to be added
- [x] Revamp landing page 
- [x] Migrate data folder to utils/constants
- [x] Update the landing page details
- [x] Homepage Customization
- [x] Create connection between user profile and their profiles - should easily navigate to student/trainer profile from user profile  -> in the profile page only have a tab to switch between dashboard and the profile 
- [x] Centralized login and logout marker on top right corner - Centralized my profile and my dashboard marker on top right corner
- [x] events page to homepage and user profile 
- [x] Specific Event to take to that event details page 
- [x] Confetti in my events page
- [x] user/auth to homepage button and main button in landing page to user/auth page
- [x] Take care of placeholders in forms 
- [x] Implement kit management 
- [x] Functional Student Dashboard - /mgfc/student - on top show the academy; attendance tab, performance tab, kits request and kits tab, fees tab; also link to my events page
- [x] Functional Trainer Dashboard - /mgfc/trainer - on top show the academy; students tab, attendance tab, performance tab, button to add students under trainer; also link to my events page
- [x] Razorpay integration 
- [x] Frontend logging
- [x] add a new /gallery
- [x] Show real data of student in student page
- [x] Show real data of student in trainer page
- [x] Improve payment transaction schema
- [x] Performance Management - Trainer can add performance details of students under him 
- [x] Make the metrics editable in Admin Panel 
- [x] Student, trainer interactions - check the flow
- [x] Grading and Feedback: Trainers provide numerical ratings and written comments (e.g., "very good" or "keep up") for specific skills such as attacking, defending, or goalkeeping
- [x] Join Academy - Admin can make a trainer join an academy; Admin can make a student join an academy; Trainer can make a student join his academy
- [x] Leave Academy - Admin can make a trainer leave an academy; Admin can make a student leave an academy; Trainer can make a student leave his academy
- [x] Students under Trainer - Admin can view all students under a trainer; Trainer can view all students under him
- [x] Proper linkage of academy, trainer, student profiles 
- [x] Fix academy management - Acad members
- [x] remove mock data