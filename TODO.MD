TODO: 

P1:

- [ ] Homepage Customization
- [ ] Add Edit Student Profile in F
- [ ] Add Edit Trainer Profile in F
- [ ] Student Dashboard
- [ ] Trainer Dashboard
- [ ] Fix Admin Dashboard - some errors
- [ ] Handle Existing Token in register pages and redirect them directly
- [ ] Add trainer register
- [ ] Check edit student - it is misbehaving
- [ ] Fix the issue with backend build and frontend - new ts version
- [ ] Complete Student Login , Trainer Login, and their pages
- [ ] show if the student is verified or not in the profile

P2:
- [ ] Frontend logging
- [ ] Health care API
- [ ] Refresh token implementation -> [1] {"expiredAt":"2025-12-07T11:09:05.000Z","level":"error","message":"Refresh token error: jwt expired","name":"TokenExpiredError","stack":"TokenExpiredError: jwt expired\n    at C:\\Projects\\mastergrade\\backend\\node_modules\\jsonwebtoken\\verify.js:190:21\n    at getSecret (C:\\Projects\\mastergrade\\backend\\node_modules\\jsonwebtoken\\verify.js:97:14)\n    at module.exports [as verify] (C:\\Projects\\mastergrade\\backend\\node_modules\\jsonwebtoken\\verify.js:101:10)\n    at verifyRefreshToken (C:\\Projects\\mastergrade\\backend\\src\\utils\\jwt.ts:26:14)\n    at refreshToken (C:\\Projects\\mastergrade\\backend\\src\\controllers\\user\\index.ts:236:23)\n    at Layer.handle [as handle_request] (C:\\Projects\\mastergrade\\backend\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (C:\\Projects\\mastergrade\\backend\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at Route.dispatch (C:\\Projects\\mastergrade\\backend\\node_modules\\express\\lib\\router\\route.js:119:3)\n    at Layer.handle [as handle_request] (C:\\Projects\\mastergrade\\backend\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at C:\\Projects\\mastergrade\\backend\\node_modules\\express\\lib\\router\\index.js:284:15","timestamp":"2025-12-15T21:50:15.142Z"}
- [ ] Soft delete When leaving events
- [ ] refresh token - what is it and how to implement
- [ ] improve isActive in events
- [ ] Migrate data folder to utils/constants
- [ ] Update the landing page details

P3: 
- [ ] Can we use MCP or some auto prompt like thing to automate prompts? like prompt engineering but automated

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
- [x] Events page - event registration