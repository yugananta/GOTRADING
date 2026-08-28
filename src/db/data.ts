// Countries, provinces, and cities are primarily used on the client.
// Since we don't want to statically import db_store.json (which might not exist during build),
// we define these as static constants here. They match the initial seeds in server.ts.

export const countries = [
  { "id": 1, "name": "Indonesia", "iso2": "ID", "phone_code": "+62", "flag_emoji": "🇮🇩", "is_supported": true, "sort_order": 1, "timezone": "Asia/Jakarta", "locale": "id-ID", "currency": "IDR" },
  { "id": 2, "name": "Malaysia", "iso2": "MY", "phone_code": "+60", "flag_emoji": "🇲🇾", "is_supported": true, "sort_order": 2, "timezone": "Asia/Kuala_Lumpur", "locale": "ms-MY", "currency": "MYR" },
  { "id": 3, "name": "Singapore", "iso2": "SG", "phone_code": "+65", "flag_emoji": "🇸🇬", "is_supported": true, "sort_order": 3, "timezone": "Asia/Singapore", "locale": "en-SG", "currency": "SGD" }
];

export const provinces = [
  { "id": 1, "country_id": 1, "name": "DKI Jakarta" },
  { "id": 2, "country_id": 1, "name": "Jawa Barat" },
  { "id": 3, "country_id": 2, "name": "Johor" },
  { "id": 4, "country_id": 2, "name": "Selangor" },
  { "id": 5, "country_id": 3, "name": "Central Region" }
];

export const cities = [
  { "id": 1, "province_id": 1, "name": "DKI Jakarta" },
  { "id": 3, "province_id": 2, "name": "Bandung" },
  { "id": 4, "province_id": 2, "name": "Bekasi" },
  { "id": 5, "province_id": 3, "name": "Johor Bahru" },
  { "id": 6, "province_id": 4, "name": "Petaling Jaya" },
  { "id": 7, "province_id": 5, "name": "Downtown Core" }
];
