# Name & Email Storage Web Application

A lightweight fullstack web application to store and manage full names and email IDs in MongoDB. The MongoDB URI is dynamically loaded from the environment variables (`.env`).

## Features
- **Frontend**: Clean, responsive UI with real-time MongoDB connection indicator, instant validation, feedback toasts, and live list of stored records.
- **Backend**: Node.js & Express RESTful API.
- **Database**: MongoDB with Mongoose ODM (reads `MONGODB_URI` from `.env`).
- **Endpoints**:
  - `GET /api/health`: Database connection status and health.
  - `GET /api/users`: Retrieve all stored records.
  - `POST /api/users`: Store a new record (`name`, `emailId`).
  - `DELETE /api/users/:id`: Remove a record.

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas connection string

### 2. Environment Configuration
Inspect or edit the `.env` file in the root directory:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/user_database
PORT=5000
```
*(If you are using MongoDB Atlas, simply replace `MONGODB_URI` with your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/user_database`)*

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Server
```bash
npm start
```
Or for development with automatic restart on file change:
```bash
npm run dev
```

### 5. Access the Website
Open your browser and navigate to:
[http://localhost:5000](http://localhost:5000)
