import 'server-only'

import { adminDb } from '@/lib/firebase-admin'

export async function writeAuditLog(
  tableName: string,
  recordId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
  performedBy: string,
): Promise<void> {
  await adminDb.collection('audit_log').add({
    table_name: tableName,
    record_id: recordId,
    action,
    old_values: oldValues,
    new_values: newValues,
    performed_by: performedBy,
    performed_at: new Date().toISOString(),
  })
}
