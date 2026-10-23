-- Creates the application database and a least-privilege MySQL user.
-- Run as root (Laragon's root has no password by default):
--   C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe -u root -p < scripts\create_database.sql
-- Replace CHANGE_ME with the password you put in .env first.

CREATE DATABASE IF NOT EXISTS facetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'facetrack'@'localhost' IDENTIFIED BY 'CHANGE_ME';
CREATE USER IF NOT EXISTS 'facetrack'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES
    ON facetrack.* TO 'facetrack'@'localhost', 'facetrack'@'127.0.0.1';

-- Test databases (pytest drops and recreates these).
GRANT ALL PRIVILEGES ON facetrack_test.* TO 'facetrack'@'localhost', 'facetrack'@'127.0.0.1';
GRANT ALL PRIVILEGES ON facetrack_test_mig.* TO 'facetrack'@'localhost', 'facetrack'@'127.0.0.1';

FLUSH PRIVILEGES;
