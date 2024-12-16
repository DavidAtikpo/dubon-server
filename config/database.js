import pg from 'pg';
import pgSession from 'connect-pg-simple';
import session from 'express-session';

export const configureDatabase = () => {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: process.env.DB_SSL === 'true',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    }
  });

  const SessionStore = pgSession(session);
  return new SessionStore({
    pool,
    createTableIfMissing: true
  });
}; 