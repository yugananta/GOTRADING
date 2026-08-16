import { ILocationRepository } from './interfaces.ts';
import { Country, Province, City } from '../db/schema.ts';
import { supabase } from '../lib/supabaseClient.ts';

const MOCK_COUNTRIES: Country[] = [
  { id: 1, name: "Indonesia", iso2: "ID", phone_code: "+62", flag_emoji: "🇮🇩", is_supported: true },
  { id: 2, name: "Malaysia", iso2: "MY", phone_code: "+60", flag_emoji: "🇲🇾", is_supported: true },
  { id: 3, name: "Singapore", iso2: "SG", phone_code: "+65", flag_emoji: "🇸🇬", is_supported: true }
];

const MOCK_PROVINCES: Record<number, Province[]> = {
  1: [
    { id: 10, country_id: 1, name: "DKI Jakarta" },
    { id: 11, country_id: 1, name: "Jawa Barat" },
    { id: 12, country_id: 1, name: "Jawa Tengah" },
    { id: 13, country_id: 1, name: "DI Yogyakarta" },
    { id: 14, country_id: 1, name: "Jawa Timur" },
    { id: 15, country_id: 1, name: "Banten" },
    { id: 16, country_id: 1, name: "Bali" }
  ]
};

const MOCK_CITIES: Record<number, City[]> = {
  10: [
    { id: 100, province_id: 10, name: "Jakarta Selatan" },
    { id: 101, province_id: 10, name: "Jakarta Pusat" },
    { id: 102, province_id: 10, name: "Jakarta Barat" }
  ]
};

export class LocationRepository implements ILocationRepository {
  async getAllCountries(): Promise<Country[]> {
    try {
      // First try lowercase 'countries' table from Supabase
      let { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        // Try uppercase 'Country' table
        const resAlt = await supabase
          .from('Country')
          .select('*')
          .order('name', { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }

      if (!data || data.length === 0) {
        return MOCK_COUNTRIES;
      }

      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        iso2: c.iso2 || c.iso_code || 'ID',
        phone_code: c.phone_code || c.dial_code || '+62',
        flag_emoji: c.flag_emoji || '🌐',
        is_supported: c.is_supported ?? true
      })) as Country[];
    } catch (e) {
      console.warn('getAllCountries fallback to mock data:', e);
      return MOCK_COUNTRIES;
    }
  }

  async getProvincesByCountryId(countryId: string | number): Promise<Province[]> {
    try {
      const cId = typeof countryId === 'string' ? parseInt(countryId, 10) : countryId;

      // Query Supabase 'provinces' directly by country_id
      let { data, error } = await supabase
        .from('provinces')
        .select('*')
        .eq('country_id', cId)
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        const resAlt = await supabase
          .from('Province')
          .select('*')
          .eq('country_id', cId)
          .order('name', { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }

      if (!data || data.length === 0) {
        return MOCK_PROVINCES[cId] || [];
      }

      return data.map((p: any) => ({
        id: p.id,
        country_id: p.country_id || cId,
        name: p.name
      })) as Province[];
    } catch (e) {
      console.warn('getProvincesByCountryId fallback to mock data:', e);
      const cId = typeof countryId === 'string' ? parseInt(countryId, 10) : countryId;
      return MOCK_PROVINCES[cId] || [];
    }
  }

  async getCitiesByProvinceId(provinceId: string | number): Promise<City[]> {
    try {
      const pId = typeof provinceId === 'string' ? parseInt(provinceId, 10) : provinceId;

      // Query Supabase 'cities' directly by province_id
      let { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('province_id', pId)
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        const resAlt = await supabase
          .from('City')
          .select('*')
          .eq('province_id', pId)
          .order('name', { ascending: true });
        if (!resAlt.error && resAlt.data && resAlt.data.length > 0) {
          data = resAlt.data;
        }
      }

      if (!data || data.length === 0) {
        return MOCK_CITIES[pId] || [];
      }

      return data.map((c: any) => ({
        id: c.id,
        province_id: c.province_id || pId,
        name: c.name
      })) as City[];
    } catch (e) {
      console.warn('getCitiesByProvinceId fallback to mock data:', e);
      const pId = typeof provinceId === 'string' ? parseInt(provinceId, 10) : provinceId;
      return MOCK_CITIES[pId] || [];
    }
  }

  async searchCountries(keyword: string, limit: number): Promise<Country[]> {
    const countries = await this.getAllCountries();
    return countries.filter(c => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }

  async getCountryByIso2(iso2: string): Promise<Country | null> {
    const countries = await this.getAllCountries();
    return countries.find(c => c.iso2.toLowerCase() === iso2.toLowerCase()) || null;
  }

  async getProvinces(countryId: number): Promise<Province[]> {
    return this.getProvincesByCountryId(countryId);
  }

  async searchProvinces(countryId: number, keyword: string, limit: number): Promise<Province[]> {
    const provinces = await this.getProvincesByCountryId(countryId);
    return provinces.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }

  async getCities(provinceId: number): Promise<City[]> {
    return this.getCitiesByProvinceId(provinceId);
  }

  async searchCities(provinceId: number, keyword: string, limit: number): Promise<City[]> {
    const cities = await this.getCitiesByProvinceId(provinceId);
    return cities.filter(c => c.name.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
  }
}
