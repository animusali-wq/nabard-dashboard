import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.NETLIFY_DATABASE_URL 
           || process.env.DATABASE_URL;
  if (!url) throw new Error("No database URL found in environment variables");
  return neon(url);
}

export async function initDb() {
  const sql = getDb();

  await sql`CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS banks (
    id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY, module TEXT NOT NULL, bank TEXT NOT NULL,
    phase TEXT DEFAULT 'SRS', status TEXT DEFAULT 'Not Started', risk TEXT DEFAULT 'Low',
    pct INTEGER DEFAULT 0, target_date DATE, actual_date DATE,
    resource TEXT, challenge TEXT, comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS change_history (
    id SERIAL PRIMARY KEY, action TEXT NOT NULL, user_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    role TEXT DEFAULT 'viewer', created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`INSERT INTO users (username, password, role) VALUES
    ('admin', 'Admin@2025', 'admin'),
    ('pm', 'PM@2025', 'pm'),
    ('viewer', 'View@2025', 'viewer')
    ON CONFLICT (username) DO NOTHING`;

  const defaultModules = [
    'HR & Payroll','Inventory','Share','Investment',
    'CTS Module (File Based)','Mobile Banking – Transaction',
    'Mobile Banking – Transaction + Add-ons','Mobile Banking – View Only',
    'Mobile Banking – View Only + Add-ons','UPI Version 2.0',
    'Asset Liability Management','Anti-Money Laundering',
    'Positive Payment System','Biometric Module','IMPS Branch Application',
    'Credit Rating Agency Interfaces','Reconciliation (3-way/4-way)','CKYC Module',
    'SMS Gateway','PAN Verification','Bulk PAN Upload','Email Integration',
    'Email Gateway','BANL','Loan Management System','Internal Audit',
    'Customer Grievance','Video KYC / Re-KYC','DigiLocker',
    'GST & Billing','Document Management System'
  ];
  for (const name of defaultModules) {
    await sql`INSERT INTO modules (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
  }

  const defaultBanks = [
    'Bank of Maharashtra','Saraswat Bank','Cosmos Bank','Shamrao Vithal Bank','Abhyudaya Bank',
    'Punjab & Maharashtra Bank','Citizen Credit Bank','Bassein Catholic Bank','TJSB Sahakari Bank',
    'Apna Sahakari Bank','Zoroastrian Co-op Bank','Bharat Co-op Bank','NKGSB Bank',
    'Janakalyan Sahakari Bank','Maharashtra Gramin Bank','Vidarbha Konkan Gramin Bank',
    'Wainganga Krishna Gramin Bank','Kashi Gomti Samyut Gramin Bank','Prathama UP Gramin Bank',
    'Madhyanchal Gramin Bank','Baroda UP Gramin Bank','Baroda Rajasthan Kshetriya Gramin Bank',
    'Rajasthan Marudhara Gramin Bank','Saurashtra Gramin Bank','Dena Gujarat Gramin Bank',
    'Bangiya Gramin Vikash Bank','Paschim Banga Gramin Bank','Uttarakhand Gramin Bank',
    'Himachal Pradesh Gramin Bank','J&K Grameen Bank','Tripura Gramin Bank',
    'Assam Gramin Vikash Bank','Meghalaya Rural Bank','Manipur Rural Bank',
    'Mizoram Rural Bank','Nagaland Rural Bank','Arunachal Pradesh Rural Bank',
    'Uttarbanga Kshetriya Gramin Bank','Bangiya Gramin Bank','Karnataka Vikas Gramin Bank'
  ];
  for (const name of defaultBanks) {
    await sql`INSERT INTO banks (name) VALUES (${name}) ON CONFLICT (name) DO NOTHING`;
  }

  return true;
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
  };
}

export function response(data, status = 200) {
  return { statusCode: status, headers: corsHeaders(), body: JSON.stringify(data) };
}

export function errorResponse(msg, status = 500) {
  return { statusCode: status, headers: corsHeaders(), body: JSON.stringify({ error: msg }) };
}
