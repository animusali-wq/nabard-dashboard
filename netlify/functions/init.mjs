import { getDb, initDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }
  try {
    const sql = getDb();
    
    // Check if already initialized — don't re-seed if data exists
    let tablesExist = false;
    try {
      const check = await sql`SELECT COUNT(*) as cnt FROM users`;
      tablesExist = parseInt(check[0].cnt) > 0;
    } catch(e) {
      tablesExist = false;
    }

    if (!tablesExist) {
      await initDb();
      return response({ success: true, message: "Database initialized and seeded" });
    } else {
      return response({ success: true, message: "Database already initialized — no changes made" });
    }
  } catch (err) {
    console.error("Init error:", err);
    return errorResponse(err.message);
  }
};
