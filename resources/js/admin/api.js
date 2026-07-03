export const csrf = window.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content;

export async function request(url, options = {}) {
  const headers = {
    Accept: 'application/json',
    'X-CSRF-TOKEN': csrf,
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || Object.values(data.errors || {}).flat().join(' ') || 'Request failed';
    throw new Error(message);
  }

  return data;
}
