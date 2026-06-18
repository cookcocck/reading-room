import { start } from './server';

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
