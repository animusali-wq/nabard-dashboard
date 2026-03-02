import { getDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  const sql = getDb();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};
  const type = params.type; // 'modules' or 'banks'

  try {
    if (method === "GET") {
      if (type === "banks") {
        const banks = await sql`SELECT * FROM banks ORDER BY name`;
        return response(banks);
      } else {
        const modules = await sql`SELECT * FROM modules ORDER BY name`;
        return response(modules);
      }
    }

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { name } = body;
      if (!name) return errorResponse("Name required", 400);

      if (type === "banks") {
        const result = await sql`INSERT INTO banks (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING RETURNING *`;
        return response(result[0] || { name }, 201);
      } else {
        const result = await sql`INSERT INTO modules (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING RETURNING *`;
        return response(result[0] || { name }, 201);
      }
    }

    if (method === "DELETE") {
      const id = params.id;
      if (!id) return errorResponse("ID required", 400);
      if (type === "banks") {
        await sql`DELETE FROM banks WHERE id = ${id}`;
      } else {
        await sql`DELETE FROM modules WHERE id = ${id}`;
      }
      return response({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("Catalog error:", err);
    return errorResponse(err.message);
  }
};
