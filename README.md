# University Management System Backend

A role-based backend system for managing university academic operations, including students, instructors, courses, departments, programs, semesters, sections, registrations, results, and semester payments.

## Live Link

https://university-management-system-backen.vercel.app

## Base URL

### Production

https://university-management-system-backen.vercel.app/api/v1

### Local Development

http://localhost:5000/api/v1

## Project Flow

The system is designed around three roles:

### Admin

- Manage departments, programs, courses, semesters, and sections
- Manage students and instructors
- Approve instructor applications
- Assign instructors to sections
- Manage course registrations and results
- View payment and system statistics

### Instructor

- Apply as an instructor with resume
- Verify email using OTP
- Access the system after admin approval
- Manage personal profile
- View assigned courses and sections
- View enrolled students
- Submit and update student results

### Student

- Register and verify email
- Login using email/password or Google
- Manage personal profile
- Browse courses and sections
- Register and drop courses
- View registered courses and results
- View academic transcript
- Pay semester fees through bKash
- View payment history

## Instructor Application Flow

```text
Instructor Application
        ↓
Resume Upload
        ↓
Email OTP Verification
        ↓
Admin Review
        ↓
Approved
        ↓
Instructor Login
        ↓
Manage Courses & Results
Course Registration Flow
Student Login
      ↓
Browse Available Courses
      ↓
Select Section
      ↓
Course Registration
      ↓
Enrollment Confirmation
      ↓
Instructor Submits Result
      ↓
Student Views Result
Payment Flow
Student
   ↓
Select Semester
   ↓
Create Payment
   ↓
bKash Payment
   ↓
Payment Verification
   ↓
Payment Completed
   ↓
Payment History
Key Features
JWT-based authentication
Role-based access control (RBAC)
Email OTP verification
Google authentication
Password reset with OTP
Student registration and profile management
Instructor application and admin approval
Instructor resume upload
Cloudinary file/image storage
Department and program management
Course and prerequisite management
Semester management
Section management
Course registration and drop
Student result management
Academic transcript generation
Semester fee payment
bKash payment integration
Pagination, filtering, sorting, and searching
Input validation using Zod
PostgreSQL database with Prisma ORM
Redis for OTP-related operations
Secure password hashing
Structured API responses
Error handling middleware
Protected routes with RBAC
Technologies
Node.js
TypeScript
Express.js
PostgreSQL
Prisma ORM
JWT
Zod
Redis
Nodemailer
Google Authentication
Cloudinary
Multer
bKash Payment Gateway
PDFKit
Vercel
API Version
/api/v1

The API is organized into separate modules for authentication, users, students, instructors, departments, programs, courses, semesters, sections, registrations, results, payments, and analytics.

Project Purpose

The main goal of this project is to provide a structured backend solution for university academic management while implementing authentication, authorization, course management, student registration, result management, file upload, payment processing, and other real-world backend concepts.
