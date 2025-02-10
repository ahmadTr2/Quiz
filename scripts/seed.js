import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { faker } from "@faker-js/faker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfigPath = path.join(__dirname, '../database.yaml');
const dbConfig = yaml.load(fs.readFileSync(dbConfigPath, 'utf8'));

const {
  'sqlite_path': sqlitePath,
} = dbConfig;

const db = new sqlite3.Database(sqlitePath);

// Function to insert data
const insertData = (table, data, callback) => {
  if (data.length === 0) return callback();

  const columns = Object.keys(data[0]).join(', ');
  const placeholders = Object.keys(data[0]).map(() => '?').join(', ');

  const insertStmt = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);

  let remaining = data.length;
  data.forEach(row => {
    insertStmt.run(Object.values(row), (err) => {
      if (err) console.error(`Error inserting into ${table}:`, err);
      remaining--;
      if (remaining === 0) {
        insertStmt.finalize();
        callback();
      }
    });
  });
};

// Seed database
db.serialize(() => {
  console.log("Clearing old data...");
  db.exec("DELETE FROM employees;");
  db.exec("DELETE FROM timesheets;", () => {
    console.log("Seeding employees...");

    // Generate and insert employees
    const employees = Array.from({ length: 10 }, () => ({
      full_name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      date_of_birth: faker.date.birthdate({ min: 18, max: 60, mode: "age" }).toISOString().split("T")[0],
      job_title: faker.person.jobTitle(),
      department: faker.commerce.department(),
      salary: faker.number.float({ min: 3000, max: 10000, precision: 2 }),
      start_date: faker.date.past({ years: 10 }).toISOString().split("T")[0],
      end_date: Math.random() > 0.8 ? faker.date.future().toISOString().split("T")[0] : null,
      photo_path: `uploads/photos/${faker.string.uuid()}.jpg`,
      document_path: `uploads/documents/${faker.string.uuid()}_cv.pdf`
    }));

    insertData('employees', employees, () => {
      console.log("Seeding timesheets...");

      // Fetch employees and insert timesheets
      db.all("SELECT id FROM employees", (err, employeesList) => {
        if (err) {
          console.error("Error fetching employees:", err);
          return db.close();
        }

        // Generate timesheets for employees
        const timesheets = employeesList.flatMap(employee => {
          return Array.from({ length: 2 }, () => ({
            employee_id: employee.id,
            start_time: faker.date.recent({ days: 30 }).toISOString(),
            end_time: faker.date.soon({ days: 1 }).toISOString(),
            summary: faker.hacker.phrase()
          }));
        });

        insertData('timesheets', timesheets, () => {
          console.log("Database seeded successfully.");
          db.close(err => {
            if (err) {
              console.error("Error closing database:", err.message);
            }
          });
        });
      });
    });
  });
});
