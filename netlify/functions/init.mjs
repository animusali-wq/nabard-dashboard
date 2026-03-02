import { initDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }
  try {
    await initDb();
    return response({ success: true, message: "Database initialized successfully" });
  } catch (err) {
    console.error("Init error:", err);
    return errorResponse(err.message);
  }
};
