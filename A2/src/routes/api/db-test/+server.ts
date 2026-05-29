//this file exists purely for testing mysql database connection 
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/sqlDB';

export async function GET() {
  const [rows] = await db.execute('SELECT * FROM test_connection LIMIT 1');
  return json({success: true, rows});
}