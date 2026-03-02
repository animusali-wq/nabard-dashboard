import { getDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  const sql = getDb();
  const method = event.httpMethod;
  const params = event.queryStringParameters || {};

  try {
    // GET all records with optional filters
    if (method === "GET") {
      let records;
      if (params.module && params.bank) {
        records = await sql`SELECT * FROM records WHERE module = ${params.module} AND bank = ${params.bank} ORDER BY updated_at DESC`;
      } else if (params.module) {
        records = await sql`SELECT * FROM records WHERE module = ${params.module} ORDER BY updated_at DESC`;
      } else if (params.bank) {
        records = await sql`SELECT * FROM records WHERE bank = ${params.bank} ORDER BY updated_at DESC`;
      } else if (params.status) {
        records = await sql`SELECT * FROM records WHERE status = ${params.status} ORDER BY updated_at DESC`;
      } else {
        records = await sql`SELECT * FROM records ORDER BY updated_at DESC`;
      }
      return response(records);
    }

    // POST - create new record
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { module, bank, phase, status, risk, pct, target_date, actual_date, resource, challenge, comments, user_name } = body;

      if (!module || !bank) return errorResponse("Module and bank are required", 400);

      const result = await sql`
        INSERT INTO records (module, bank, phase, status, risk, pct, target_date, actual_date, resource, challenge, comments)
        VALUES (
          ${module}, ${bank}, ${phase || 'SRS'}, ${status || 'Not Started'},
          ${risk || 'Low'}, ${pct || 0},
          ${target_date || null}, ${actual_date || null},
          ${resource || ''}, ${challenge || ''}, ${comments || ''}
        )
        RETURNING *
      `;

      await sql`
        INSERT INTO change_history (action, user_name)
        VALUES (${`Added record: ${module} @ ${bank}`}, ${user_name || 'System'})
      `;

      return response(result[0], 201);
    }

    // PUT - update record
    if (method === "PUT") {
      const body = JSON.parse(event.body || "{}");
      const { id, phase, status, risk, pct, target_date, actual_date, resource, challenge, comments, user_name } = body;

      if (!id) return errorResponse("Record ID required", 400);

      const result = await sql`
        UPDATE records SET
          phase = ${phase},
          status = ${status},
          risk = ${risk},
          pct = ${pct},
          target_date = ${target_date || null},
          actual_date = ${actual_date || null},
          resource = ${resource || ''},
          challenge = ${challenge || ''},
          comments = ${comments || ''},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (!result.length) return errorResponse("Record not found", 404);

      await sql`
        INSERT INTO change_history (action, user_name)
        VALUES (${`Updated: ${result[0].module} @ ${result[0].bank} → ${status}, ${pct}%`}, ${user_name || 'System'})
      `;

      return response(result[0]);
    }

    // DELETE - remove record
    if (method === "DELETE") {
      const id = params.id;
      if (!id) return errorResponse("Record ID required", 400);

      const existing = await sql`SELECT * FROM records WHERE id = ${id}`;
      if (!existing.length) return errorResponse("Record not found", 404);

      await sql`DELETE FROM records WHERE id = ${id}`;

      await sql`
        INSERT INTO change_history (action, user_name)
        VALUES (${`Deleted: ${existing[0].module} @ ${existing[0].bank}`}, ${params.user || 'System'})
      `;

      return response({ success: true });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("Records error:", err);
    return errorResponse(err.message);
  }
};
