export async function load(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export function save(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function remove(key: string) {
  localStorage.removeItem(key);
}
