CREATE DATABASE IF NOT EXISTS asgkit;
USE asgkit;

CREATE TABLE courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(191) NOT NULL,
  slug          VARCHAR(191) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_courses_slug (slug)
);

CREATE TABLE workshops (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT NOT NULL,
  name          VARCHAR(191) NOT NULL,
  slug          VARCHAR(191) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_workshops_course_slug (course_id, slug)
);

CREATE TABLE submissions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  workshop_id   INT NOT NULL,
  student_id    VARCHAR(191) NOT NULL,
  file_names    JSON NOT NULL,
  submitted_at  DATETIME NOT NULL,
  client_ip     VARCHAR(64) NULL,
  client_mac    VARCHAR(17) NULL,
  FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE CASCADE,
  UNIQUE KEY uq_submission_workshop_student (workshop_id, student_id)
);

-- Single-row table for app-wide settings (not a generic key-value store,
-- since there are only a couple of typed settings).
CREATE TABLE app_settings (
  id                INT PRIMARY KEY DEFAULT 1,
  max_file_size_mb  INT NOT NULL DEFAULT 50,
  theme             ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system'
);
INSERT INTO app_settings (id) VALUES (1);
