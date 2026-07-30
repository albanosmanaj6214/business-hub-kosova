// Application-layer immutability for snapshots + version history. There is NO
// update path for these; guards make an attempted mutation an explicit error.
// (Database-level immutability via triggers/permissions is documented as deferred.)
export class ImmutabilityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImmutabilityError'
  }
}

/** Return a frozen shallow copy; mutating it throws in strict mode. */
export function freezeRecord<T extends object>(rec: T): Readonly<T> {
  return Object.freeze({ ...rec })
}

/** Explicit guard used where a mutation might be attempted. Always throws. */
export function rejectMutation(entity: 'RawSnapshot' | 'IngestionRecordVersion', field: string): never {
  throw new ImmutabilityError(`${entity} është immutabël: ndryshimi i '${field}' nuk lejohet.`)
}
