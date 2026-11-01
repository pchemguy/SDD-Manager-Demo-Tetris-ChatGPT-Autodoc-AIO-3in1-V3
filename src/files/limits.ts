/** R8 bounds shared by the owner and isolated worker. */
export const MAX_FILE_BYTES=4*1024*1024;
export const CODEC_TIMEOUT_MS=10_000;
/** Bound SQLite constraint/integrity allocations as well as file bytes and elapsed work. */
export const SQLITE_HEAP_BYTES=64*1024*1024;
