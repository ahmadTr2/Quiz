import { useLoaderData, Form, useNavigate, useActionData } from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useState } from "react";

// Fetch employee data based on ID
export async function loader({ params }: { params: { employeeId: string } }) {
  const db = await getDB();
  const employee = await db.get("SELECT * FROM employees WHERE id = ?;", [params.employeeId]);

  if (!employee) {
    throw new Response("Employee not found", { status: 404 });
  }

  return { employee };
}

// Handle updates
export async function action({ request, params }: { request: Request; params: { employeeId: string } }) {
  const db = await getDB();
  const formData = await request.formData();

  const full_name = formData.get("full_name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const job_title = formData.get("job_title");
  const department = formData.get("department");
  const salary = parseFloat(formData.get("salary") as string);
  const start_date = formData.get("start_date");
  const end_date = formData.get("end_date") || null;

  if (!full_name || !email || !phone || isNaN(salary) || salary < 3000) {
    return { error: "All required fields must be filled, and salary must be at least $3000." };
  }

  await db.run(
    `UPDATE employees 
     SET full_name = ?, email = ?, phone = ?, job_title = ?, department = ?, salary = ?, start_date = ?, end_date = ? 
     WHERE id = ?;`,
    [full_name, email, phone, job_title, department, salary, start_date, end_date, params.employeeId]
  );

  return { success: "Employee updated successfully!" };
}

export default function EmployeePage() {
  const { employee } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Employee Details</h1>

      {/* Display Success/Error Messages */}
      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
      {actionData?.success && <p className="text-green-500">{actionData.success}</p>}

      {/* Edit Mode */}
      {isEditing ? (
        <Form method="post" className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block">Full Name</label>
            <input type="text" name="full_name" id="full_name" required defaultValue={employee.full_name} className="border p-2 w-full" />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block">Email</label>
            <input type="email" name="email" id="email" required defaultValue={employee.email} className="border p-2 w-full" />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block">Phone</label>
            <input type="text" name="phone" id="phone" required defaultValue={employee.phone} className="border p-2 w-full" />
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="job_title" className="block">Job Title</label>
            <input type="text" name="job_title" id="job_title" required defaultValue={employee.job_title} className="border p-2 w-full" />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block">Department</label>
            <input type="text" name="department" id="department" required defaultValue={employee.department} className="border p-2 w-full" />
          </div>

          {/* Salary */}
          <div>
            <label htmlFor="salary" className="block">Salary ($)</label>
            <input type="number" name="salary" id="salary" required defaultValue={employee.salary} className="border p-2 w-full" />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block">Start Date</label>
            <input type="date" name="start_date" id="start_date" required defaultValue={employee.start_date} className="border p-2 w-full" />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end_date" className="block">End Date (Optional)</label>
            <input type="date" name="end_date" id="end_date" defaultValue={employee.end_date || ""} className="border p-2 w-full" />
          </div>

          {/* Save & Cancel Buttons */}
          <div className="col-span-2 flex gap-4">
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </Form>
      ) : (
        // View Mode
        <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md">
          <p><strong>Email:</strong> {employee.email}</p>
          <p><strong>Phone:</strong> {employee.phone}</p>
          <p><strong>Job Title:</strong> {employee.job_title}</p>
          <p><strong>Department:</strong> {employee.department}</p>
          <p><strong>Salary:</strong> ${employee.salary.toLocaleString()}</p>
          <p><strong>Start Date:</strong> {employee.start_date}</p>
          {employee.end_date && <p><strong>End Date:</strong> {employee.end_date}</p>}

          {/* Display Employee Photo & Documents */}
          {employee.photo_path && <img src={`/${employee.photo_path}`} alt="Employee Photo" className="w-32 h-32 object-cover rounded" />}
          {employee.document_path && <a href={`/${employee.document_path}`} download className="text-blue-500 underline">Download Document</a>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-4">
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">Edit</button>
        )}
        <button onClick={() => navigate("/employees")} className="bg-blue-500 text-white px-4 py-2 rounded">Back to Employees</button>
      </div>
    </div>
  );
}
