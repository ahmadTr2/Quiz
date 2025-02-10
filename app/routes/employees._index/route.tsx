import { useLoaderData, Link, useSearchParams } from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useState } from "react";

// Fetch employees from the database
export async function loader({ request }: { request: Request }) {
  const db = await getDB();
  
  // Extract search params for filtering and sorting
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sort") || "full_name";
  const order = url.searchParams.get("order") === "desc" ? "DESC" : "ASC";
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  // Fetch employees based on filters and sorting
  const employees = await db.all(
    `SELECT id, full_name, email, job_title, department, salary FROM employees
     WHERE full_name LIKE ?
     ORDER BY ${sortBy} ${order}
     LIMIT ? OFFSET ?;`,
    [`%${searchQuery}%`, limit, offset]
  );

  const totalEmployees = await db.get("SELECT COUNT(*) as count FROM employees WHERE full_name LIKE ?;", [`%${searchQuery}%`]);

  return { employees, totalEmployees: totalEmployees.count, searchQuery, sortBy, order, page };
}

export default function EmployeesPage() {
  const { employees, totalEmployees, searchQuery, sortBy, order, page } = useLoaderData() as any;
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.ceil(totalEmployees / 5);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Employees</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name..."
        className="border p-2 mb-4 w-full"
        defaultValue={searchQuery}
        onChange={(e) => {
          searchParams.set("search", e.target.value);
          setSearchParams(searchParams);
        }}
      />

      {/* Table of Employees */}
      <table className="table-auto w-full border-collapse border">
        <thead>
          <tr>
            <th><a href={`?sort=full_name&order=${order === "ASC" ? "desc" : "asc"}`}>Full Name</a></th>
            <th><a href={`?sort=email&order=${order === "ASC" ? "desc" : "asc"}`}>Email</a></th>
            <th><a href={`?sort=job_title&order=${order === "ASC" ? "desc" : "asc"}`}>Job Title</a></th>
            <th><a href={`?sort=department&order=${order === "ASC" ? "desc" : "asc"}`}>Department</a></th>
            <th><a href={`?sort=salary&order=${order === "ASC" ? "desc" : "asc"}`}>Salary</a></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee: any) => (
            <tr key={employee.id} className="border">
              <td>{employee.full_name}</td>
              <td>{employee.email}</td>
              <td>{employee.job_title}</td>
              <td>{employee.department}</td>
              <td>${employee.salary.toLocaleString()}</td>
              <td>
                <Link to={`/employees/${employee.id}`} className="text-blue-500">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`px-4 py-2 ${page === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => {
              searchParams.set("page", (i + 1).toString());
              setSearchParams(searchParams);
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-4">
        <Link to="/employees/new" className="mr-4 bg-green-500 text-white px-4 py-2 rounded">New Employee</Link>
        <Link to="/timesheets" className="bg-blue-500 text-white px-4 py-2 rounded">View Timesheets</Link>
      </div>
    </div>
  );
}
