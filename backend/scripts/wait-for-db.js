import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'arbitrage_db'
});

async function main() {
  let attempts = 30;
  while (attempts > 0) {
    try {
      await client.connect();
      console.log('✅ Database is ready!');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`⏳ Waiting for database... (${attempts} attempts left) - error: ${err.message}`);
      attempts--;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('❌ Database connection timed out.');
  process.exit(1);
}

main();
