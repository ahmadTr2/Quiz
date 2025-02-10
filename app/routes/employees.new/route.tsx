import { Form, redirect, type ActionFunction } from "react-router";
import { getDB } from "~/db/getDB";
import { writeFile } from "fs/promises";
import path from "path";

// Employee age and salary compliance settings
const MIN_AGE = 18;
const MIN_SALARY = 3000;

// Employee creation logic
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  
  const full_name = formData.get("full_name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();
  const date_of_birth = formData.get("date_of_birth")?.toString();
  const job_title = formData.get("job_title")?.toString().trim();
  const department = formData.get("department")?.toString().trim();
  const salary = parseFloat(formData.get("salary") as string);
  const start_date = formData.get("start_date")?.toString();
  const end_date = formData.get("end_date")?.toString() || null;

  // Compliance validation: Age check
  const birthYear = new Date(date_of_birth!).getFullYear();
  const currentYear = new Date().getFullYear();
  if (currentYear - birthYear < MIN_AGE) {
    throw new Response("Employee must be at least 18 years old.", { status: 400 });
  }

  // Compliance validation: Salary check
  if (salary < MIN_SALARY) {
    throw new Response("Salary must be at least $3000.", { status: 400 });
  }

  // File handling for photo and documents
  let photoPath = null;
  let documentPath = null;

  const photo = formData.get("photo") as File;
  if (photo && photo.size > 0) {
    const photoFileName = `uploads/photos/${Date.now()}_${photo.name}`;
    const photoSavePath = path.resolve(`./public/${photoFileName}`);
    await writeFile(photoSavePath, Buffer.from(await photo.arrayBuffer()));
    photoPath = photoFileName;
  }

  const document = formData.get("document") as File;
  if (document && document.size > 0) {
    const documentFileName = `uploads/documents/${Date.now()}_${document.name}`;
    const documentSavePath = path.resolve(`./public/${documentFileName}`);
    await writeFile(documentSavePath, Buffer.from(await document.arrayBuffer()));
    documentPath = documentFileName;
  }

  // Insert into database
  const db = await getDB();
  await db.run(
    `INSERT INTO employees (full_name, email, phone, date_of_birth, job_title, department, salary, start_date, end_date, photo_path, document_path) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [full_name, email, phone, date_of_birth, job_title, department, salary, start_date, end_date, photoPath, documentPath]
  );

  return redirect("/employees");
};

export default function NewEmployeePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Employee</h1>

      <Form method="post" encType="multipart/form-data" className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md">
        {/* Personal Information */}
        <div>
          <label htmlFor="full_name" className="block">Full Name</label>
          <input type="text" name="full_name" id="full_name" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="email" className="block">Email</label>
          <input type="email" name="email" id="email" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="phone" className="block">Phone</label>
          <input type="text" name="phone" id="phone" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block">Date of Birth</label>
          <input type="date" name="date_of_birth" id="date_of_birth" required className="border p-2 w-full" />
        </div>

        {/* Professional Information */}
        <div>
          <label htmlFor="job_title" className="block">Job Title</label>
          <input type="text" name="job_title" id="job_title" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="department" className="block">Department</label>
          <input type="text" name="department" id="department" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="salary" className="block">Salary ($)</label>
          <input type="number" name="salary" id="salary" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="start_date" className="block">Start Date</label>
          <input type="date" name="start_date" id="start_date" required className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="end_date" className="block">End Date (Optional)</label>
          <input type="date" name="end_date" id="end_date" className="border p-2 w-full" />
        </div>

        {/* File Uploads */}
        <div>
          <label htmlFor="photo" className="block">Employee Photo (Optional)</label>
          <input type="file" name="photo" id="photo" accept="image/*" className="border p-2 w-full" />
        </div>

        <div>
          <label htmlFor="document" className="block">Employee Document (Optional)</label>
          <input type="file" name="document" id="document" accept=".pdf,.doc,.docx" className="border p-2 w-full" />
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Create Employee</button>
        </div>
      </Form>

      {/* Navigation */}
      <div className="mt-6">
        <a href="/employees" className="text-blue-500 mr-4">Back to Employees</a>
        <a href="/timesheets" className="text-blue-500">View Timesheets</a>
      </div>
    </div>
  );
}
