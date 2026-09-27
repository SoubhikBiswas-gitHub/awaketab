// Restore planning: compare a backup with the target namespace, then (only with --apply) write.
//
// A restore never deletes. Keys missing from the target are created; keys whose current value equals the
// backup are left alone; keys whose value differs are conflicts and are only overwritten with --overwrite,
// because the live value is usually newer (a licence activated after the backup was taken). Records whose
// `expiration` has passed, or is less than the 60 s KV minimum away, are skipped: KV would reject them, and
// the data had expired anyway.
import type { IKvRecord } from './format.ts';
import { isExpiredForWrite, type IKvStore } from './store.ts';

export interface IRestorePlan {
  create: IKvRecord[];
  conflict: IKvRecord[];
  same: IKvRecord[];
  expired: IKvRecord[];
  filtered: number;
}

export interface IRestoreOptions {
  nowMs?: number;
  prefixes?: readonly string[];
}

export async function planRestore(records: IKvRecord[], target: IKvStore, options: IRestoreOptions = {}): Promise<IRestorePlan> {
  const nowMs = options.nowMs ?? Date.now();
  const prefixes = options.prefixes && options.prefixes.length > 0 ? options.prefixes : null;
  const plan: IRestorePlan = { create: [], conflict: [], same: [], expired: [], filtered: 0 };
  const wanted: IKvRecord[] = [];
  for (const row of records) {
    if (prefixes && !prefixes.some((prefix) => row.key.startsWith(prefix))) plan.filtered += 1;
    else if (isExpiredForWrite(row, nowMs)) plan.expired.push(row);
    else wanted.push(row);
  }
  const current = wanted.length > 0 ? await target.getMany(wanted.map((row) => row.key)) : new Map<string, string | null>();
  for (const row of wanted) {
    const live = current.get(row.key) ?? null;
    if (live === null) plan.create.push(row);
    else if (live === row.value) plan.same.push(row);
    else plan.conflict.push(row);
  }
  return plan;
}

export function restoreWrites(plan: IRestorePlan, overwrite: boolean): IKvRecord[] {
  return overwrite ? [...plan.create, ...plan.conflict] : [...plan.create];
}

export async function applyRestore(plan: IRestorePlan, target: IKvStore, overwrite: boolean): Promise<number> {
  const writes = restoreWrites(plan, overwrite);
  if (writes.length > 0) await target.putMany(writes);
  return writes.length;
}

export interface IRestoreSummary {
  create: number;
  conflict: number;
  same: number;
  expired: number;
  filtered: number;
  willWrite: number;
}

export function summarizePlan(plan: IRestorePlan, overwrite: boolean): IRestoreSummary {
  return {
    create: plan.create.length,
    conflict: plan.conflict.length,
    same: plan.same.length,
    expired: plan.expired.length,
    filtered: plan.filtered,
    willWrite: restoreWrites(plan, overwrite).length,
  };
}
