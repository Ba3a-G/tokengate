import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL as string,
    max: 20,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on('connect', (): void => {
    console.log('connected to the db');
});

pool.on('error', (err: Error): void => {
    console.error(err.message);
    process.exit(1);
});

const connectToDatabase = async (): Promise<void> => {
    try {
        await pool.connect();
    } catch (err) {
        console.error('Failed to connect to the database', err);
        process.exit(1);
    }
};

export { pool, connectToDatabase };