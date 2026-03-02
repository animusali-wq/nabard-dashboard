import { getDb, response, errorResponse, corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  const sql = getDb();
  const method = event.httpMethod;

  try {
    // GET history
    if (method === "GET") {
      const history = await sql`SELECT * FROM change_history ORDER BY created_at DESC LIMIT 50`;
      return response(history);
    }

    // POST bulk import
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { rows, user_name } = body;
      if (!rows || !Array.isArray(rows)) return errorResponse("Rows array required", 400);

      let added = 0, updated = 0;

      for (const row of rows) {
        const { module, bank, phase, status, risk, pct, target_date, actual_date, resource, challenge, comments } = row;
        if (!module || !bank) continue;

        // Upsert module and bank
        await sql`INSERT INTO modules (name) VALUES (${module}) ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO banks (name) VALUES (${bank}) ON CONFLICT (name) DO NOTHING`;

        // Check existing record
        const existing = await sql`SELECT id FROM records WHERE module = ${module} AND bank = ${bank}`;

        if (existing.length) {
          await sql`
            UPDATE records SET phase=${phase||'SRS'}, status=${status||'Not Started'},
            risk=${risk||'Low'}, pct=${pct||0}, target_date=${target_date||null},
            actual_date=${actual_date||null}, resource=${resource||''},
            challenge=${challenge||''}, comments=${comments||''}, updated_at=NOW()
            WHERE id = ${existing[0].id}
          `;
          updated++;
        } else {
          await sql`
            INSERT INTO records (module, bank, phase, status, risk, pct, target_date, actual_date, resource, challenge, comments)
            VALUES (${module}, ${bank}, ${phase||'SRS'}, ${status||'Not Started'}, ${risk||'Low'},
            ${pct||0}, ${target_date||null}, ${actual_date||null}, ${resource||''}, ${challenge||''}, ${comments||''})
          `;
          added++;
        }
      }

      await sql`
        INSERT INTO change_history (action, user_name)
        VALUES (${`Bulk import: ${rows.length} rows, ${added} added, ${updated} updated`}, ${user_name || 'System'})
      `;

      return response({ success: true, added, updated, total: rows.length });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("History error:", err);
    return errorResponse(err.message);
  }
};
