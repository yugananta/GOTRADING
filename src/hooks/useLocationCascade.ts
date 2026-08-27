import { useState, useEffect } from 'react';
import { Country, Province, City } from '../db/schema';
import { apiFetch } from '../utils/apiFetch';

export const useLocationCascade = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await apiFetch('/api/locations/countries');
        if (!response.ok) {
          setCountries([]);
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setCountries([]);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setCountries(data);
        } else {
          console.error('Expected array for countries, got:', JSON.stringify(data));
          setCountries([]);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Fetch provinces when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setProvinces([]);
      setSelectedProvince(null);
      setSelectedCity(null);
      return;
    }

    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const response = await apiFetch(`/api/locations/provinces?countryId=${selectedCountry.id}`);
        if (!response.ok) {
          setProvinces([]);
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setProvinces([]);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProvinces(data);
        } else {
          console.error('Expected array for provinces, got:', JSON.stringify(data));
          setProvinces([]);
        }
      } catch (error) {
        console.error('Error fetching provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    setSelectedProvince(null);
    setSelectedCity(null);
    fetchProvinces();
  }, [selectedCountry]);

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setSelectedCity(null);
      return;
    }

    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await apiFetch(`/api/locations/cities?provinceId=${selectedProvince.id}`);
        if (!response.ok) {
          setCities([]);
          return;
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setCities([]);
          return;
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setCities(data);
        } else {
          console.error('Expected array for cities, got:', JSON.stringify(data));
          setCities([]);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    setSelectedCity(null);
    fetchCities();
  }, [selectedProvince]);

  return {
    countries,
    provinces,
    cities,
    selectedCountry,
    selectedProvince,
    selectedCity,
    setSelectedCountry,
    setSelectedProvince,
    setSelectedCity,
    isLoadingCountries,
    isLoadingProvinces,
    isLoadingCities,
    dialCode: selectedCountry?.phone_code || ''
  };
};
