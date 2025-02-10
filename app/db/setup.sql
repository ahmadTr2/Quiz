-- Drop tables if they exist
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS timesheets;

-- Create employees table
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    date_of_birth TEXT NOT NULL, -- Use TEXT to store date in 'YYYY-MM-DD' format (SQLite best practice)
    job_title TEXT NOT NULL,
    department TEXT NOT NULL,
    salary REAL NOT NULL,
    start_date TEXT NOT NULL, -- Use TEXT for date format storage
    end_date TEXT NULL, -- Optional end date
    photo_path TEXT NULL, -- Path to employee photo
    document_path TEXT NULL -- Path to employee documents (Bonus)
);

-- Create timesheets table
CREATE TABLE timesheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    start_time TEXT NOT NULL, -- Store date and time as ISO format (e.g., 'YYYY-MM-DDTHH:MM:SS')
    end_time TEXT NOT NULL,
    summary TEXT NULL, -- Optional work summary
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE -- Cascade delete to remove timesheets if an employee is deleted
);
