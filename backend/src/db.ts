import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Set DATABASE_URL (e.g. postgres://user:password@localhost:5432/todo)",
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

/** Create table if missing (simple bootstrap; use migrations for production). */
export async function ensureSchema(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(2000) NOT NULL,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        priority varchar(20) NOT NULL,
        status varchar(32) NOT NULL,
        tags text[] NOT NULL DEFAULT '{}',
        due_date timestamptz,
        estimate_hours double precision,
        is_favorite boolean NOT NULL DEFAULT false,
        CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high')),
        CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed'))
      );
    `);
  } finally {
    client.release();
  }
}
