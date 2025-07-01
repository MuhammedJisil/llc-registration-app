# LLC Registration Platform

A full-stack web application for registering and managing Limited Liability Companies (LLCs) with secure authentication, payment processing, and admin management features.

🎥 Demo Video
Watch the full project demo on LinkedIn: Project Demo Video

Features
User Features

User registration, login, and password recovery
Google OAuth authentication
LLC registration with secure document upload (via Cloudinary)
Stripe payment integration
Registration status tracking
Download registration summaries
Receive messages and files from admin

Admin Features

View all registered users and registrations
Update registration status
Send notifications and emails to users
Upload and manage files for users (via Cloudinary)
Track payment status

Tech Stack

Frontend: React with Vite, Tailwind CSS, shadcn/ui
Backend: Node.js, Express.js
Database: PostgreSQL
Payments: Stripe
File Storage: Cloudinary
Authentication: Google OAuth, JWT

Getting Started
Prerequisites

Node.js (v16+)
PostgreSQL
Stripe account
Cloudinary account
Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuhammedJisil/llc-registration-app.git
   cd llc-registration-app
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd client
   npm install
   
   # Backend
   cd server
   npm install
   ```

3. **Setup Database**
   ```bash
   # Create database
   createdb llc_registration
   
   # Import the database dump file
   psql -U postgres -d llc_registration -f llc_registration.sql
   ```

4. **Environment Setup**
   
   Backend `.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DB_USER=postgres
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=llc_registration
   
   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key-here
   SESSION_SECRET=your-session-secret-key-here
   ADMIN_JWT_SECRET=your-admin-jwt-secret-key-here
   
   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_refresh_token
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Default Admin Accounts
   ADMIN1_USERNAME=admin1
   ADMIN1_PASSWORD=securepassword1
   ADMIN1_FULLNAME=Super Admin
   ADMIN2_USERNAME=admin2
   ADMIN2_PASSWORD=securepassword2
   ADMIN2_FULLNAME=Admin Manager
   ADMIN3_USERNAME=admin3
   ADMIN3_PASSWORD=securepassword3
   ADMIN3_FULLNAME=Support Admin
   ```
   
   Frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

5. **Run the Application**
   ```bash
   # Start backend
   cd server
   npm run dev
   
   # Start frontend (in new terminal)
   cd client
   npm run dev
   ```

6. **Access the Application**
   - Frontend:http://localhost:5173
   - Backend API: http://localhost:5000
