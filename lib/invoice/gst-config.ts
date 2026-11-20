/**
 * GST lookup configuration loader.
 * Merges gst-config.json with defaults and validates it's enabled.
 */

export interface GstLookupConfig {
  enabled: boolean;
  endpoint: string;
  method: string;
  api_key: string;
  auth_header: string;
  auth_prefix: string;
  auth_query: string;
  extra_headers: string[];
  timeout: number;
  cache_ttl: number;
  rate_limit_per_hour: number;
  daily_limit: number;
  map: {
    success: string;
    legal_name: string;
    trade_name: string;
    status: string;
    type: string;
    constitution: string;
    registration_date: string;
    cancellation_date: string;
    address: string;
    additional_addresses: string;
    additional_address_field: string;
  };
}

const defaults: GstLookupConfig = {
  enabled: false,
  endpoint:
    'https://gst-verification-api-get-profile-returns-data.p.rapidapi.com/v1/gstin/{gstin}/details',
  method: 'GET',
  api_key: '',
  auth_header: 'x-rapidapi-key',
  auth_prefix: '',
  auth_query: '',
  extra_headers: [
    'x-rapidapi-host: gst-verification-api-get-profile-returns-data.p.rapidapi.com',
  ],
  timeout: 12,
  cache_ttl: 30 * 86400,
  rate_limit_per_hour: 10,
  daily_limit: 15,
  map: {
    success: '',
    legal_name: 'data.legal_name',
    trade_name: 'data.trade_name',
    status: 'data.status',
    type: 'data.type',
    constitution: 'data.business_constitution',
    registration_date: 'data.registration_date',
    cancellation_date: 'data.cancellation_date',
    address: 'data.place_of_business_principal.address',
    additional_addresses: 'data.place_of_business_additional',
    additional_address_field: 'address',
  },
};

let cachedConfig: GstLookupConfig | null = null;

export function gstLookupConfig(): GstLookupConfig {
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const apiKey = process.env.GST_RAPIDAPI_KEY || '';
  const enabled = (process.env.GST_LOOKUP_ENABLED || '').toLowerCase() === 'true' && apiKey !== '';
  const host = process.env.GST_RAPIDAPI_HOST;
  cachedConfig = {
    ...defaults,
    api_key: apiKey,
    enabled,
  };
  if (host) {
    cachedConfig.extra_headers = [`x-rapidapi-host: ${host}`];
  }

  cachedConfig.enabled =
    enabled && !!cachedConfig.endpoint && !cachedConfig.endpoint.includes('example.com');

  return cachedConfig;
}
