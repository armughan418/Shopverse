/**
 * Tiny TTL in-memory cache for read-heavy list endpoints.
 * Cleared on product mutations from productController.
 */

const store = new Map();

function now() {
  return Date.now();
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs = 60_000) {
  store.set(key, { value, expiresAt: now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

/** Invalidate keys whose string starts with prefix */
function invalidatePrefix(prefix) {
  for (const k of store.keys()) {
    if (String(k).startsWith(prefix)) store.delete(k);
  }
}

function clearProductLists() {
  invalidatePrefix("products:");
}

module.exports = { get, set, del, invalidatePrefix, clearProductLists };
