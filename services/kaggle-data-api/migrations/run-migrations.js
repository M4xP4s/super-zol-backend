#!/usr/bin/env node

/**
 * Migration runner script
 * Runs pending database migrations using node-pg-migrate
 * Usage: node migrations/run-migrations.js
 */

import { runner } from 'node-pg-migrate';

const databaseUrl =
  process.env['DATABASE_URL'] ||
  `postgresql://${process.env['DB_USER'] || 'postgres'}:${process.env['DB_PASSWORD'] || 'postgres'}@${process.env['DB_HOST'] || 'localhost'}:${process.env['DB_PORT'] || '5432'}/${process.env['DB_NAME'] || 'postgres'}`;

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    console.log(`Database URL: ${databaseUrl.replace(/:[^:/@]*@/, ':****@')}`);

    const migrationsRun = await runner({
      databaseUrl,
      migrationsTable: 'pgmigrations',
      dir: 'services/kaggle-data-api/migrations',
      direction: 'up',
      verbose: true,
    });

    console.log(`✅ Successfully ran ${migrationsRun.length} migration(s)`);
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Migration failed:', errorMessage);

    // Exit with code 1 to indicate failure
    process.exit(1);
  }
}

runMigrations();
