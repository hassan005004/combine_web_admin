export const blankEntry = {
  title: '',
  entry_type: 'both',
  status: 'pending',
  sort_order: 0,
  url: '',
  google_play_url: '',
  app_store_url: '',
  application_id: '',
  logo: null,
  logo_url: '',
  remove_logo: false,
  show_in_apps_gallery: false,
  cache_ttl_hours: 168,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  privacy_policy: '',
  terms_conditions: '',
  support_policy: '',
  about_us: '',
  app_version: '',
  min_build_code: '',
  force_update: false,
  ads: {
    bottom:      { enabled: false, unit_id: '', frequency: 0 },
    app_open:    { enabled: false, unit_id: '', frequency: 0 },
    full_screen: { enabled: false, unit_id: '', frequency: 5 },
    rewarded:    { enabled: false, unit_id: '', frequency: 0 },
    native:      { enabled: false, unit_id: '', frequency: 3 },
  },
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
