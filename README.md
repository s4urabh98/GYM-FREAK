# GymFreak

## What this is

GymFreak is a comprehensive gym management system that enables fitness facility administrators to manage members, track memberships, and provide workout resources, while allowing members to view their profiles, access workout videos, and check available equipment. The platform supports role-based access (admin and member) with membership plan tracking and time slot management.

### Stack
- **Language(s):** JavaScript (Node.js), EJS templates, HTML/CSS
- **Framework / runtime:** Express.js 4.21.2
- **Notable libraries:** 
  - **MongoDB + Mongoose** — NoSQL database with ODM for user, equipment, and workout video models
  - **Passport + JWT** — Authentication and authorization with JSON Web Tokens
  - **Multer** — File upload handling for workout videos and thumbnails (up to 100MB)
  - **Bcryptjs** — Password hashing and security
  - **Express-session** — Session management for user authentication

## How it's organized
GymFreak/
├── app.js                 # Main Express application
├── config/               # Configuration files
│   └── multerConfig.js   # Multer file upload configuration
├── models/               # MongoDB models
│   ├── User.js          # Member and admin user model
│   ├── WorkoutVideo.js  # Workout video model
│   ├── Equipment.js     # Equipment inventory model
│   └── Announcement.js  # Announcements model
├── controllers/          # Route handlers
├── routes/              # API routes
│   └── authroutes.js    # Authentication routes
├── middlewares/         # Custom middleware
├── views/               # EJS templates
│   └── components/      # Reusable components
├── public/              # Static files (CSS, images, client-side JS)
├── admin/               # Admin-specific static files
├── uploads/             # Directory for uploaded videos and images
├── package.json         # Project dependencies
└── .env                 # Environment variables (not included in repo)
# GymFreak

GymFreak is a gym management web application built with Node.js, Express, EJS, and MongoDB. It supports both member and admin workflows, including signup/login, membership tracking, workout video management, equipment records, and admin dashboard statistics.

## Features

- Member registration and login
- Membership plans: cardio, exercise, and yoga
- Time-slot tracking for gym access
- Admin dashboard with member statistics
- Member management and status updates
- Workout video upload and listing
- Equipment management
- Flash-based feedback messages
- Session-based authentication using Express sessions and Passport

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- EJS templates
- Passport.js
- bcryptjs
- JWT (for auth token generation)
- Multer for file uploads

## Project Structure

```bash
GymFreak/
├── app.js
├── package.json
├── .env
├── config/
├── controllers/
├── middlewares/
├── models/
├── public/
├── routes/
├── views/
├── schema.js
├── package-lock.json
└── node_modules/
