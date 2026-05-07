export function formatPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

export function getLocalStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setLocalStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
