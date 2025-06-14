# Event Sphere

A full-stack event management portal built with React and Node.js. This application allows users to browse, create, and manage events with features including user authentication, real-time notifications, interactive maps, analytics dashboard.

## Features

- **User Authentication**: Secure login and registration system with email verification
- **Event Management**: Create, view, edit, and delete events with detailed information
- **Interactive Maps**: Location-based event discovery using Leaflet maps
- **Real-time Updates**: Live notifications and updates using WebSocket connections
- **Admin Dashboard**: Administrative interface with analytics and metrics
- **Responsive Design**: Mobile-friendly interface built with Bootstrap
- **File Uploads**: Support for event images and media

## Tech Stack

### Frontend
- **React 18.2.0** - Frontend framework
- **React Router DOM 6.11.2** - Client-side routing
- **Bootstrap 5.3.6** & **React Bootstrap 2.10.10** - UI framework and components
- **Styled Components 6.0.0** - CSS-in-JS styling

### Backend
- **Node.js** - Runtime environment
- **Express 4.18.2** - Web framework
- **SQLite3 5.1.7** - Database
- **WebSockets (ws 8.13.0)** - Real-time communication

## Third-Party Plugins and Libraries

### Frontend Dependencies
- **@fortawesome/fontawesome-svg-core**: ^6.4.0 - Icon library core
- **@fortawesome/free-solid-svg-icons**: ^6.4.0 - FontAwesome solid icons
- **@fortawesome/react-fontawesome**: ^0.2.0 - FontAwesome React integration
- **axios**: ^1.4.0 - HTTP client for API requests
- **leaflet**: ^1.9.4 - Interactive maps library
- **react-leaflet**: ^4.2.1 - React wrapper for Leaflet
- **react-datepicker**: ^4.10.0 - Date picker component
- **react-icons**: ^5.5.0 - Icon library
- **react-toastify**: ^9.1.3 - Toast notifications
- **recharts**: ^2.15.3 - Charting library for analytics
- **socket.io-client**: ^4.6.1 - WebSocket client

### Backend Dependencies
- **bcrypt**: ^5.1.0 - Password hashing
- **cookie-parser**: ^1.4.6 - Cookie parsing middleware
- **cors**: ^2.8.5 - Cross-origin resource sharing
- **dotenv**: ^16.0.3 - Environment variable management
- **express-rate-limit**: ^6.7.0 - Rate limiting middleware
- **helmet**: ^6.0.1 - Security headers
- **jsonwebtoken**: ^9.0.0 - JWT token management
- **multer**: ^1.4.5-lts.1 - File upload handling
- **nodemailer**: ^6.9.1 - Email sending
- **sanitize-html**: ^2.17.0 - HTML sanitization
- **uuid**: ^9.0.0 - Unique ID generation

## Prerequisites

Before running this project, make sure you have the following installed:
- **Node.js** (version 14 or higher)
- **npm** (Node Package Manager)

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/karimnagdii/EventSphere
cd event-portal-new/backup
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Initialize the database (if needed)
node db/init.js

# Start the backend server
npm start
```
The backend server will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```
The frontend application will run on `http://localhost:3000`

### 4. Quick Start (Alternative)
If available, you can use the provided batch file:
```bash
# From the root directory
start.bat
```

## Environment Configuration

Create a `.env` file in the backend directory with the following variables:
```env
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
PORT=5000
```

## Database

The application uses SQLite database with the following files:
- `event_portal.db` - Main application database
- `events.db` - Events-specific data

Database schema and seed data can be found in the `backend/db/` directory.

## API Endpoints

The backend provides RESTful API endpoints for:
- User authentication (`/api/auth`)
- Event management (`/api/events`)
- Admin operations (`/api/admin`)
- File uploads (`/api/uploads`)

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```
This creates an optimized production build in the `build/` directory.

### Backend
The backend is production-ready and can be deployed using:
```bash
cd backend
npm start
```


## License

This project is licensed under the MIT License.

