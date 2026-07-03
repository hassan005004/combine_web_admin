export const blankEntry = {
  title: '',
  entry_type: 'both',
  url: '',
  google_play_url: '',
  app_store_url: '',
  application_id: '',
  cache_ttl_hours: 168,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  privacy_policy: '',
  terms_conditions: '',
  support_policy: '',
  about_us: '',
  primary_color: '#000000',
  secondary_color: '#ffffff',
};

export function labelize(value) {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(value) {
  return value ? String(value).slice(0, 16).replace('T', ' ') : '-';
}

export function formatCell(value) {
  if (value === true) return 'Active';
  if (value === false) return 'Inactive';
  if (value == null || value === '') return '-';
  return String(value);
}
