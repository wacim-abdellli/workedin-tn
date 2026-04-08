# Monthly Backup Restore Test

## Purpose
Verify backups are restorable and complete.

## Procedure
1. Log into Supabase console
2. Go to Settings → Backups
3. Select backup from 7 days ago
4. Click "Restore to new database"
5. Run validation queries:
   - `SELECT COUNT(*) FROM profiles;`
   - `SELECT COUNT(*) FROM transactions;`
   - `SELECT * FROM messages LIMIT 1;`
6. Verify data integrity
7. Delete test database

## Schedule
- First Monday of each month
- 30 minutes allocated
