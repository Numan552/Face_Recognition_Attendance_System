# 📖 Full Setup Guide — AI Face Recognition Attendance System
# Using XAMPP MySQL

=====================================================
 STEP 1: INSTALL REQUIRED SOFTWARE
=====================================================

1. XAMPP
   Download: https://www.apachefriends.org/download.html
   - Windows: Run installer, install to C:\xampp
   - Choose components: Apache (optional), MySQL (required), phpMyAdmin

2. Node.js v18 LTS
   Download: https://nodejs.org (click "LTS" button)
   - Run installer with default settings
   - After install, verify: open CMD and type: node --version

3. VS Code
   Download: https://code.visualstudio.com
   - Install with default settings

=====================================================
 STEP 2: START XAMPP MYSQL
=====================================================

1. Open XAMPP Control Panel (from Start Menu or C:\xampp\xampp-control.exe)
2. Click the GREEN "Start" button next to MySQL
3. MySQL status turns green and shows port 3306
4. Keep XAMPP Control Panel open while using the project

NOTE: You do NOT need to start Apache for this project.
      Only MySQL is required.

=====================================================
 STEP 3: IMPORT DATABASE VIA PHPMYADMIN
=====================================================

1. Open browser → go to: http://localhost/phpmyadmin
   (phpMyAdmin opens automatically when XAMPP MySQL is running)

2. In the LEFT SIDEBAR, click "+ New" to create a new database

3. In the "Database name" field, type exactly:
      face_attendance_db

4. Click the "Create" button

5. You are now inside the new database.
   Click the "Import" tab at the top of the page.

6. Click "Choose File" button
   Navigate to your project folder → database → select schema.sql

7. Scroll down and click "Go" button

8. Wait a few seconds → you should see:
   "Import has been successfully finished."

9. In the left sidebar, expand "face_attendance_db"
   You should see 8 tables:
   - admins
   - attendance
   - attendance_sessions
   - departments
   - face_data
   - students
   - subjects
   - teachers

=====================================================
 STEP 4: OPEN PROJECT IN VS CODE
=====================================================

1. Extract the faceattend-project.zip if not done already
   Right-click ZIP → Extract All → choose folder (e.g. Desktop)

2. Open VS Code

3. Click: File → Open Folder
   Select the extracted "faceattend" folder → Click "Select Folder"

4. You should see in the left Explorer panel:
   - client/
   - server/
   - database/
   - README.md
   - SETUP.md

5. Open the integrated terminal:
   Click: Terminal → New Terminal
   (or press Ctrl + ` on your keyboard)

=====================================================
 STEP 5: CHECK THE .ENV FILE (Already Configured!)
=====================================================

The .env file is ALREADY set up for XAMPP. Just verify:

1. In VS Code Explorer, expand "server" folder
2. Click on ".env" file to open it
3. It should look like this:

   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=face_attendance_db
   JWT_SECRET=faceAttendSystem2024SecretKeyXAMPP_ChangeThis
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:3000

IMPORTANT: DB_PASSWORD is EMPTY — that is correct for XAMPP!
XAMPP's MySQL root user has no password by default.

If you set a password for MySQL in XAMPP, enter it after DB_PASSWORD=

=====================================================
 STEP 6: INSTALL & START BACKEND SERVER
=====================================================

In the VS Code terminal (should be in the faceattend folder):

   cd server
   npm install

Wait for packages to install (may take 1-2 minutes).
You will see a lot of text scroll by — this is normal.

Then start the server:

   npm run dev

You should see:
   ✅ MySQL Database connected successfully
   🚀 Server running on http://localhost:5000
   🔐 JWT Auth enabled

KEEP THIS TERMINAL OPEN. The server must stay running.

If you see ERROR: "ER_ACCESS_DENIED_ERROR":
→ Your MySQL password is wrong. Check server/.env DB_PASSWORD

If you see ERROR: "ECONNREFUSED":
→ XAMPP MySQL is not started. Open XAMPP and start MySQL.

If you see ERROR: "'nodemon' is not recognized":
→ Run: npm install -g nodemon    then try npm run dev again

=====================================================
 STEP 7: INSTALL & START FRONTEND
=====================================================

Open a SECOND terminal in VS Code:
Click the + (plus) icon in the Terminal panel to open new terminal

In the new terminal:

   cd client
   npm install

Wait for packages (may take 3-5 minutes first time — downloads React, face-api.js etc.)

Then start the frontend:

   npm start

Your browser will automatically open: http://localhost:3000

You should see the FaceAttend login page!

If browser doesn't open automatically:
→ Manually open browser and go to: http://localhost:3000

=====================================================
 STEP 8: LOGIN TO THE SYSTEM
=====================================================

On the login page, you can click "Use demo credentials →" button
or type manually:

ADMIN LOGIN:
  Email:    admin@university.edu
  Password: Admin@123
  Role tab: Admin

TEACHER LOGIN:
  Email:    rahim@university.edu
  Password: Teacher@123
  Role tab: Teacher

Other teacher accounts:
  Email:    karim@university.edu      Password: Teacher@123
  Email:    nasrin@university.edu     Password: Teacher@123

=====================================================
 STEP 9: REGISTER STUDENT FACES
=====================================================

1. Login as Admin or Teacher
2. Click "Face Register" in the left sidebar
3. Browser shows popup: "localhost wants to use your camera" → click ALLOW
4. Select a student from the list on the left
5. Click "Start Face Capture" button
   - AI models load from internet (first time ~10-15 seconds, needs Wi-Fi)
   - Status bar shows: "✅ AI Models loaded"
6. Look at the webcam — when face is detected, it shows a capture preview
7. Click "Save Face Data" to register the face
8. Repeat for other students

TIPS:
- Make sure room is well lit
- Face the camera directly
- Remove glasses if recognition fails
- Each student needs their own face registered

=====================================================
 STEP 10: TAKE ATTENDANCE
=====================================================

1. Login as Teacher
2. Click "Take Attendance" in sidebar
3. Select a subject from dropdown
4. Click "Start Attendance Session"
5. Click "Start Recognition" — scanning begins
6. Students face the camera one by one
7. System automatically marks them present with timestamp
8. Each recognized student appears in "Marked Present" panel
9. Click "End" button when class is done

=====================================================
 STEP 11: VIEW REPORTS
=====================================================

1. Login as Admin
2. Click "Reports" in sidebar
3. Filter by: Department, Subject, Date Range
4. Click "Generate Report"
5. Click "Export CSV" to download as spreadsheet

=====================================================
 TROUBLESHOOTING
=====================================================

Problem: Server shows "Cannot connect to MySQL"
Fix: Make sure XAMPP MySQL is Started (green in XAMPP panel)

Problem: "Access denied for user 'root'"
Fix: Open server/.env and make sure DB_PASSWORD= is empty (no password)
     OR add your MySQL password if you set one

Problem: Frontend shows "Network Error" or blank page
Fix: Make sure backend server is running (npm run dev in server/ folder)

Problem: Face models not loading
Fix: Check your internet connection — models download from GitHub CDN
     Wait 30 seconds and try again

Problem: Webcam not working
Fix: - Click "Allow" when browser asks for camera permission
     - Check if another app (Zoom, Teams) is using the camera
     - Try closing and reopening the browser

Problem: "port 3000 already in use"
Fix: Type Y when React asks to use port 3001, or
     Kill the process: taskkill /F /IM node.exe (Windows)

Problem: npm command not found
Fix: Restart VS Code after installing Node.js

=====================================================
 KEEPING BOTH SERVERS RUNNING
=====================================================

You need TWO terminals open at all times:

Terminal 1 (server):
   cd server
   npm run dev
   → Shows: 🚀 Server running on http://localhost:5000

Terminal 2 (client):
   cd client
   npm start
   → Shows: Compiled successfully! http://localhost:3000

Both must be running simultaneously for the app to work.

=====================================================
 DEFAULT SAMPLE DATA LOADED
=====================================================

Departments: CSE, ECE, ME, CE, IT

Students (10): Ahmed Hossain, Fatima Begum, Kamal Hasan, 
               Rina Akter, Shamim Rahman, Nusrat Jahan,
               Rakib Islam, Sumona Khatun, Jahangir Alam, 
               Parveen Sultana

Subjects: AI, Machine Learning, Database, Networks, Software Eng.

Teachers: Dr. Rahim Uddin, Prof. Karim Ahmed, Dr. Nasrin Sultana

=====================================================
 PROJECT PORTS SUMMARY
=====================================================

XAMPP MySQL:     localhost:3306
Backend API:     localhost:5000
Frontend App:    localhost:3000
phpMyAdmin:      localhost/phpmyadmin

=====================================================
 FACE API MODELS INFO
=====================================================

Models are loaded from GitHub CDN on first use (~12MB total):
- ssd_mobilenetv1 — face detection
- face_landmark_68 — landmark points
- face_recognition — 128-dim embedding

After first load, browsers usually cache them.
If offline, models won't load — internet required for first use.

=====================================================
EOF

echo "SETUP.md created"
