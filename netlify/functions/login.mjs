import { getDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }
  if (event.httpMethod !== "POST") return errorResponse("Method not allowed", 405);

  try {
    const { username, password } = JSON.parse(event.body || "{}");
    if (!username || !password) return errorResponse("Username and password required", 400);

    const sql = getDb();
    const users = await sql`
      SELECT id, username, role FROM users
      WHERE username = ${username.toLowerCase()} AND password = ${password}
    `;

    if (!users.length) return errorResponse("Invalid credentials", 401);

    const user = users[0];
    return response({ success: true, user: { id: user.id, name: user.username, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    return errorResponse(err.message);
  }
};
