import { corsHeaders } from "./db.mjs";

export const handler = async (event) => {
  // Shows which env vars exist (not their values) so we can diagnose
  const vars = {
    HAS_NETLIFY_DATABASE_URL: !!process.env.NETLIFY_DATABASE_URL,
    HAS_DATABASE_URL: !!process.env.DATABASE_URL,
    HAS_NETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED,
    NODE_VERSION: process.version,
    // Show first 40 chars of URL to confirm it's correct (safe - no password visible at start)
    URL_PREFIX: process.env.NETLIFY_DATABASE_URL 
      ? process.env.NETLIFY_DATABASE_URL.substring(0, 40) + '...' 
      : 'NOT SET'
  };
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify(vars, null, 2)
  };
};
