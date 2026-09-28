# 🏋️ GymFreak - Gym Management System

A comprehensive gym management platform built with Node.js and EJS that provides efficient administration tools and member activity tracking. GymFreak streamlines gym operations with separate dashboards for admins and members, enabling seamless management of memberships, equipment inventory, and workout content.

## ✨ Features

### For Admins
- **Dashboard Analytics**: View key metrics including total members, active members, and membership plan distribution
- **Member Management**: 
  - View and manage all gym members
  - Update member details (name, email, weight, height)
  - Manage membership plans (Yoga, Cardio, Exercise)
  - Control membership status (active/inactive)
  - Assign time slots to members with capacity limits
- **Workout Video Management**: 
  - Upload and manage workout videos with metadata
  - Categorize videos and set durations
  - Delete outdated content
  - Support for video thumbnails
- **Equipment Tracking**: 
  - Maintain inventory of gym equipment
  - Track equipment condition and quantity
  - Categorize equipment
  - Add descriptions and images

### For Members
- **Member Dashboard**: 
  - View personal fitness profile (weight, height, membership plan)
  - Track assigned time slot
  - View recent workout videos
  - Check available equipment
- **Workout Videos**: Access categorized workout videos with durations
- **Equipment Browse**: View available equipment with condition status and descriptions

### Core Features
- **User Authentication**: Secure signup and login system with session management
- **Role-Based Access Control**: Separate dashboards and features for admins and members
- **Time Slot Management**: 
  - Assign members to specific gym time slots
  - Track capacity (max 20 members per slot)
  - 16 available slots throughout the day (6 AM - 10 PM)
- **MongoDB Integration**: Persistent data storage with Mongoose ODM
- **File Upload Support**: Upload workout videos and images with Multer

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS (Embedded JavaScript Templates)
- **Database**: MongoDB
- **Authentication**: Passport.js
- **Session Management**: Express Session
- **File Upload**: Multer
- **Environment Variables**: Dotenv

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v12 or higher)
- MongoDB (running locally or connection string for remote instance)
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/BachhavKamlesh/GymFreak.git
cd GymFreak
