INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Admin User', 'admin@example.com', ?, 'admin'),
  (2, 'Teacher User', 'teacher@example.com', ?, 'teacher'),
  (3, 'Student User', 'student@example.com', ?, 'student');

INSERT INTO courses (id, title, description, teacher_id) VALUES
  (1, 'JavaScript Basics', 'Learn the basics of JavaScript.', 2),
  (2, 'Express LMS Project', 'Build a small LMS with Express.', 2);

INSERT INTO lessons (id, course_id, title, content, file_name) VALUES
  (1, 1, 'Variables', 'Variables store values.', NULL),
  (2, 1, 'Functions', 'Functions group reusable code.', NULL);
