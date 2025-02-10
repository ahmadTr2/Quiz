import { useLoaderData, Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getDB } from "~/db/getDB";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import { createViewWeek } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";

import "@schedule-x/theme-default/dist/index.css";

// Function to ensure proper date format for Schedule-X (YYYY-MM-DD)
function formatForScheduleX(dateString: string): string {
  if (!dateString) return "";

  try {
    let date = new Date(dateString);

    // Ensure date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date format detected:", dateString);
      return "";
    }

    // Convert to ISO format, keeping only the date part (YYYY-MM-DD)
    let formattedDate = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD

    console.log("Formatted event time for Schedule-X:", formattedDate); // Debugging

    return formattedDate;
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return "";
  }
}

// Fetch timesheets with employee details
export async function loader({ request }: { request: Request }) {
  const db = await getDB();
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sort") || "start_time";
  const order = url.searchParams.get("order") === "desc" ? "DESC" : "ASC";

  const timesheetsAndEmployees = await db.all(
    `SELECT timesheets.*, employees.full_name, employees.id AS employee_id 
     FROM timesheets 
     JOIN employees ON timesheets.employee_id = employees.id
     WHERE employees.full_name LIKE ?
     ORDER BY ${sortBy} ${order}`,
    [`%${searchQuery}%`]
  );

  return { timesheetsAndEmployees, searchQuery, sortBy, order };
}

export default function TimesheetsPage() {
  const { timesheetsAndEmployees, searchQuery, sortBy, order } = useLoaderData() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  // Create Schedule-X Events Plugin
  const eventsService = useState(() => createEventsServicePlugin())[0];

  // Initialize the Calendar
  const calendar = useCalendarApp({
    views: [createViewWeek()],
    events: timesheetsAndEmployees
      .map((ts: any) => {
        const formattedStart = formatForScheduleX(ts.start_time);
        const formattedEnd = formatForScheduleX(ts.end_time);

        if (!formattedStart || !formattedEnd) {
          console.warn("Skipping invalid event:", ts);
          return null;
        }

        return {
          id: ts.id.toString(),
          title: `Work - ${ts.full_name}`,
          start: formattedStart,
          end: formattedEnd,
        };
      })
      .filter(Boolean), // Remove invalid events
    plugins: [eventsService],
  });

  useEffect(() => {
    eventsService.getAll(); // Load events when component mounts
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Timesheets</h1>

      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-4">
        <button 
          onClick={() => setViewMode("table")} 
          className={`px-4 py-2 rounded ${viewMode === "table" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Table View
        </button>
        <button 
          onClick={() => setViewMode("calendar")} 
          className={`px-4 py-2 rounded ${viewMode === "calendar" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Calendar View
        </button>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by employee name..."
        className="border p-2 mb-4 w-full"
        defaultValue={searchQuery}
        onChange={(e) => {
          searchParams.set("search", e.target.value);
          setSearchParams(searchParams);
        }}
      />

      {/* Conditional View Rendering */}
      {viewMode === "table" ? (
        <table className="table-auto w-full border-collapse border">
          <thead>
            <tr>
              <th>
                <a href={`?sort=full_name&order=${order === "ASC" ? "desc" : "asc"}`}>Employee</a>
              </th>
              <th>
                <a href={`?sort=start_time&order=${order === "ASC" ? "desc" : "asc"}`}>Start Time</a>
              </th>
              <th>End Time</th>
              <th>Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheetsAndEmployees.map((timesheet: any) => (
              <tr key={timesheet.id} className="border">
                <td>{timesheet.full_name}</td>
                <td>{new Date(timesheet.start_time).toLocaleString()}</td>
                <td>{new Date(timesheet.end_time).toLocaleString()}</td>
                <td>{timesheet.summary || "N/A"}</td>
                <td>
                  <Link to={`/timesheets/${timesheet.id}`} className="text-blue-500">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ScheduleXCalendar calendarApp={calendar} />
      )}

      {/* Navigation Buttons */}
      <div className="mt-6">
        <Link to="/timesheets/new" className="mr-4 bg-green-500 text-white px-4 py-2 rounded">New Timesheet</Link>
        <Link to="/employees" className="bg-blue-500 text-white px-4 py-2 rounded">View Employees</Link>
      </div>
    </div>
  );
}
