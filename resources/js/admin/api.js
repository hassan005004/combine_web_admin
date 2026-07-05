export const csrf = window.csrfToken || document.querySelector('meta[name="csrf-token"]')?.content;

function notify(type, message) {
  window.dispatchEvent(new CustomEvent('admin-toast', { detail: { type, message } }));
}

function isMutation(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method || 'GET').toUpperCase());
}

function successMessage(method) {
  const normalized = String(method || 'GET').toUpperCase();
  if (normalized === 'DELETE') return 'Deleted successfully.';
  if (normalized === 'POST') return 'Saved successfully.';
  return 'Updated successfully.';
}

export async function request(url, options = {}) {
  const method = options.method || 'GET';
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
    if (isMutation(method)) {
      notify('error', message);
    }
    throw new Error(message);
  }

  if (isMutation(method)) {
    notify('success', data.message || successMessage(method));
  }

  return data;
}
