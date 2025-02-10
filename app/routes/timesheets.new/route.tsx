import { useLoaderData, Form, redirect } from "react-router-dom";
import { getDB } from "~/db/getDB";

// Fetch employees for the dropdown
export async function loader() {
  const db = await getDB();
  const employees = await db.all("SELECT id, full_name FROM employees");
  return { employees };
}

import type { ActionFunction } from "react-router";

// Handle form submission (create a new timesheet)
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  
  const employee_id = formData.get("employee_id");
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");
  const summary = formData.get("summary");

  if (new Date(start_time as string) >= new Date(end_time as string)) {
    throw new Response("Start time must be before end time.", { status: 400 });
  }

  const db = await getDB();
  await db.run(
    "INSERT INTO timesheets (employee_id, start_time, end_time, summary) VALUES (?, ?, ?, ?)",
    [employee_id, start_time, end_time, summary]
  );

  return redirect("/timesheets");
};

export default function NewTimesheetPage() {
  const { employees } = useLoaderData() as any;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Timesheet</h1>

      <Form method="post" className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md">
        {/* Employee Selection */}
        <div>
          <label htmlFor="employee_id" className="block">Employee</label>
          <select name="employee_id" id="employee_id" required className="border p-2 w-full">
            <option value="">Select an Employee</option>
            {employees.map((employee: any) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="start_time" className="block">Start Time</label>
          <input type="datetime-local" name="start_time" id="start_time" required className="border p-2 w-full" />
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="end_time" className="block">End Time</label>
          <input type="datetime-local" name="end_time" id="end_time" required className="border p-2 w-full" />
        </div>

        {/* Summary (Optional) */}
        <div className="col-span-2">
          <label htmlFor="summary" className="block">Summary</label>
          <textarea name="summary" id="summary" className="border p-2 w-full" placeholder="Briefly describe the work done"></textarea>
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Create Timesheet</button>
        </div>
      </Form>

      {/* Navigation */}
      <div className="mt-6">
        <a href="/timesheets" className="text-blue-500 mr-4">Back to Timesheets</a>
        <a href="/employees" className="text-blue-500">View Employees</a>
      </div>
    </div>
  );
}
