# 🎯 AI Face Recognition Attendance System

Final Year B.Sc. CSE Project — React.js · Node.js · MySQL (XAMPP) · face-api.js · JWT

## ⚡ Quick Start with XAMPP

### Requirements
- XAMPP (for MySQL) — https://www.apachefriends.org
- Node.js v18+ — https://nodejs.org
- VS Code — https://code.visualstudio.com

### Step 1 — Start XAMPP MySQL
Open XAMPP Control Panel → click Start next to MySQL

### Step 2 — Import Database
1. Go to http://localhost/phpmyadmin
2. Click New → name it: face_attendance_db → Create
3. Click Import tab → Choose File → select database/schema.sql → Go

### Step 3 — Run Backend
Open terminal in VS Code, navigate to server/:
  cd server
  npm install
  npm run dev

Expected: ✅ MySQL connected | 🚀 Server on http://localhost:5000

### Step 4 — Run Frontend
Open second terminal:
  cd client
  npm install
  npm start

Browser opens at http://localhost:3000

### Login Credentials
Admin:   admin@university.edu  /  Admin@123
Teacher: rahim@university.edu  /  Teacher@123

## 📁 Structure
client/   — React.js frontend
server/   — Node.js/Express API
database/ — MySQL schema + sample data

## 🔧 .env Already Configured for XAMPP
server/.env is pre-set:
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=      (empty — XAMPP default)
  DB_NAME=face_attendance_db
