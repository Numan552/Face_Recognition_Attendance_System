-- ============================================================
-- AI Face Recognition Attendance System
-- MySQL Schema for XAMPP
-- Import via: phpMyAdmin → face_attendance_db → Import → schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS face_attendance_db;
USE face_attendance_db;

-- ========================
-- TABLE: departments
-- ========================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- TABLE: admins
-- ========================
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================
-- TABLE: teachers
-- ========================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department_id INT,
    avatar VARCHAR(255),
    designation VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ========================
-- TABLE: students
-- ========================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    department_id INT,
    semester INT DEFAULT 1,
    section VARCHAR(10),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    address TEXT,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    face_registered TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ========================
-- TABLE: subjects
-- ========================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id INT,
    semester INT,
    credits INT DEFAULT 3,
    teacher_id INT,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- ========================
-- TABLE: face_data
-- ========================
CREATE TABLE face_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    face_descriptor JSON NOT NULL,
    face_image_path VARCHAR(255),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ========================
-- TABLE: attendance_sessions
-- ========================
CREATE TABLE attendance_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    total_students INT DEFAULT 0,
    present_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

-- ========================
-- TABLE: attendance
-- ========================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    status ENUM('present', 'absent', 'late') DEFAULT 'present',
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5,4),
    recognition_method ENUM('face', 'manual') DEFAULT 'face',
    marked_by INT,
    UNIQUE KEY unique_attendance (session_id, student_id),
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ========================
-- INDEXES
-- ========================
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_attendance_date ON attendance_sessions(session_date);
CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_students_dept ON students(department_id);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Departments
INSERT INTO departments (name, code, description) VALUES
('Computer Science & Engineering', 'CSE', 'Department of Computer Science and Engineering'),
('Electronics & Communication', 'ECE', 'Department of Electronics and Communication Engineering'),
('Mechanical Engineering', 'ME', 'Department of Mechanical Engineering'),
('Civil Engineering', 'CE', 'Department of Civil Engineering'),
('Information Technology', 'IT', 'Department of Information Technology');

-- ========================
-- Admin account
-- Password: Admin@123
-- Hash generated fresh with bcrypt rounds=10
-- ========================
INSERT INTO admins (name, email, password, phone) VALUES
('System Administrator', 'admin@university.edu', '$2b$10$5WrmknElH15nemU5Hbf7Hu5/GDTRI3b0lNCPIF87WupRgmBqejxcy', '01700000000');

-- ========================
-- Teacher accounts
-- Password: Teacher@123
-- ========================
INSERT INTO teachers (name, email, password, employee_id, phone, department_id, designation) VALUES
('Dr. Rahim Uddin',   'rahim@university.edu',  '$2b$10$W37YmI0tg8MlUK/Ob05JleNTWGpExaEruwqjykM5/zRqCz5s72Spm', 'EMP001', '01711111111', 1, 'Associate Professor'),
('Prof. Karim Ahmed', 'karim@university.edu',  '$2b$10$W37YmI0tg8MlUK/Ob05JleNTWGpExaEruwqjykM5/zRqCz5s72Spm', 'EMP002', '01722222222', 1, 'Assistant Professor'),
('Dr. Nasrin Sultana','nasrin@university.edu', '$2b$10$W37YmI0tg8MlUK/Ob05JleNTWGpExaEruwqjykM5/zRqCz5s72Spm', 'EMP003', '01733333333', 2, 'Professor');

-- Students
INSERT INTO students (name, email, roll_number, department_id, semester, section, phone, gender) VALUES
('Ahmed Hossain',   'ahmed@student.edu',   'CSE-2021-001', 1, 6, 'A', '01800000001', 'Male'),
('Fatima Begum',    'fatima@student.edu',  'CSE-2021-002', 1, 6, 'A', '01800000002', 'Female'),
('Kamal Hasan',     'kamal@student.edu',   'CSE-2021-003', 1, 6, 'A', '01800000003', 'Male'),
('Rina Akter',      'rina@student.edu',    'CSE-2021-004', 1, 6, 'B', '01800000004', 'Female'),
('Shamim Rahman',   'shamim@student.edu',  'CSE-2021-005', 1, 6, 'B', '01800000005', 'Male'),
('Nusrat Jahan',    'nusrat@student.edu',  'CSE-2021-006', 1, 6, 'B', '01800000006', 'Female'),
('Rakib Islam',     'rakib@student.edu',   'CSE-2021-007', 1, 6, 'A', '01800000007', 'Male'),
('Sumona Khatun',   'sumona@student.edu',  'CSE-2021-008', 1, 6, 'A', '01800000008', 'Female'),
('Jahangir Alam',   'jahangir@student.edu','CSE-2021-009', 1, 6, 'C', '01800000009', 'Male'),
('Parveen Sultana', 'parveen@student.edu', 'CSE-2021-010', 1, 6, 'C', '01800000010', 'Female');

-- Subjects
INSERT INTO subjects (name, code, department_id, semester, credits, teacher_id) VALUES
('Artificial Intelligence', 'CSE-601', 1, 6, 3, 1),
('Machine Learning',        'CSE-602', 1, 6, 3, 1),
('Database Management',     'CSE-603', 1, 6, 3, 2),
('Computer Networks',       'CSE-604', 1, 6, 3, 2),
('Software Engineering',    'CSE-605', 1, 6, 3, 1);

-- ============================================================
-- VERIFY: Run these queries to check data loaded correctly
-- SELECT * FROM admins;       -- should show 1 admin
-- SELECT * FROM teachers;     -- should show 3 teachers
-- SELECT * FROM students;     -- should show 10 students
-- SELECT * FROM subjects;     -- should show 5 subjects
-- ============================================================
