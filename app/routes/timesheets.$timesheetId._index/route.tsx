import { useLoaderData, Form, useNavigate, useActionData } from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useState } from "react";

// Fetch timesheet details
export async function loader({ params }: { params: { timesheetId: string } }) {
  const db = await getDB();
  const timesheet = await db.get(
    `SELECT timesheets.*, employees.full_name, employees.id AS employee_id 
     FROM timesheets 
     JOIN employees ON timesheets.employee_id = employees.id 
     WHERE timesheets.id = ?;`,
    [params.timesheetId]
  );

  const employees = await db.all("SELECT id, full_name FROM employees;");

  if (!timesheet) {
    throw new Response("Timesheet not found", { status: 404 });
  }

  return { timesheet, employees };
}

// Handle updates
export async function action({ request, params }: { request: Request; params: { timesheetId: string } }) {
  const db = await getDB();
  const formData = await request.formData();

  const employee_id = formData.get("employee_id");
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");
  const summary = formData.get("summary");

  // Ensure start_time is before end_time
  if (new Date(start_time as string) >= new Date(end_time as string)) {
    return { error: "Start time must be before end time." };
  }

  await db.run(
    `UPDATE timesheets 
     SET employee_id = ?, start_time = ?, end_time = ?, summary = ? 
     WHERE id = ?;`,
    [employee_id, start_time, end_time, summary, params.timesheetId]
  );

  return { success: "Timesheet updated successfully!" };
}

export default function TimesheetPage() {
  const { timesheet, employees } = useLoaderData() as any;
  const actionData = useActionData() as any;
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Timesheet Details</h1>

      {/* Display Success/Error Messages */}
      {actionData?.error && <p className="text-red-500">{actionData.error}</p>}
      {actionData?.success && <p className="text-green-500">{actionData.success}</p>}

      {/* Edit Mode */}
      {isEditing ? (
        <Form method="post" className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow-md">
          {/* Employee Selection */}
          <div>
            <label htmlFor="employee_id" className="block">Employee</label>
            <select name="employee_id" id="employee_id" required defaultValue={timesheet.employee_id} className="border p-2 w-full">
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
            <input type="datetime-local" name="start_time" id="start_time" required defaultValue={timesheet.start_time.slice(0, 16)} className="border p-2 w-full" />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="end_time" className="block">End Time</label>
            <input type="datetime-local" name="end_time" id="end_time" required defaultValue={timesheet.end_time.slice(0, 16)} className="border p-2 w-full" />
          </div>

          {/* Summary */}
          <div className="col-span-2">
            <label htmlFor="summary" className="block">Summary</label>
            <textarea name="summary" id="summary" className="border p-2 w-full">{timesheet.summary || ""}</textarea>
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
          <p><strong>Employee:</strong> {timesheet.full_name}</p>
          <p><strong>Start Time:</strong> {new Date(timesheet.start_time).toLocaleString()}</p>
          <p><strong>End Time:</strong> {new Date(timesheet.end_time).toLocaleString()}</p>
          <p><strong>Summary:</strong> {timesheet.summary || "N/A"}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-4">
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">Edit</button>
        )}
        <button onClick={() => navigate("/timesheets")} className="bg-blue-500 text-white px-4 py-2 rounded">Back to Timesheets</button>
      </div>
    </div>
  );
}
