/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const ServiceContext = createContext(null);

export function ServiceProvider({ children }) {
  const [institutions, setInstitutions] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search state
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Fetch institutions and services on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch institutions
        const instResponse = await api.get('/institutions');
        if (instResponse.success && instResponse.data) {
          setInstitutions(instResponse.data);
        } else {
          console.error('Failed to fetch institutions:', instResponse.message);
        }

        // Fetch services
        const svcResponse = await api.get('/services');
        if (svcResponse.success && svcResponse.data) {
          setServices(svcResponse.data);
        } else {
          console.error('Failed to fetch services:', svcResponse.message);
        }

      } catch (err) {
        console.error('Error fetching institutions/services:', err);
        setError('Failed to load service data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get services for a specific institution
  const getServicesByInstitution = useCallback((institutionId) => {
    return services.filter(service => service.institution_id === institutionId);
  }, [services]);

  // Get institution by ID
  const getInstitutionById = useCallback((institutionId) => {
    return institutions.find(inst => inst.id === institutionId);
  }, [institutions]);

  // Get institution by code
  function getInstitutionByCode(code) {
    return institutions.find(inst => inst.code === code);
  }

  // Get service by ID
  function getServiceById(serviceId) {
    return services.find(svc => svc.id === serviceId);
  }

  // Search services and institutions using backend API
  const searchServicesAndInstitutions = useCallback(async (query) => {
    // If no query, return all institutions with their services (local data)
    if (!query || query.trim() === '') {
      return institutions.map(inst => ({
        institution: inst,
        services: getServicesByInstitution(inst.id)
      }));
    }

    // If query is too short, return empty results
    if (query.trim().length < 2) {
      return [];
    }

    try {
      setSearchLoading(true);
      setSearchError(null);

      // Call backend search API
      const response = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);

      if (!response.success || !response.data) {
        setSearchError(response.message || 'Search failed');
        return [];
      }

      const { institutions: searchInstitutions, services: searchServices } = response.data;

      // Group services by institution
      const institutionMap = new Map();

      // Add institutions from search results
      searchInstitutions.forEach(inst => {
        institutionMap.set(inst.id, {
          institution: inst,
          services: []
        });
      });

      // Add services to their institutions
      searchServices.forEach(svc => {
        if (!institutionMap.has(svc.institution_id)) {
          // If institution not in search results, fetch from local data
          const inst = getInstitutionById(svc.institution_id);
          if (inst) {
            institutionMap.set(svc.institution_id, {
              institution: inst,
              services: []
            });
          }
        }
        
        if (institutionMap.has(svc.institution_id)) {
          institutionMap.get(svc.institution_id).services.push(svc);
        }
      });

      return Array.from(institutionMap.values());

    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Search failed. Please try again.');
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, [institutions, getServicesByInstitution, getInstitutionById]);

  // Refresh institutions and services from backend
  const refreshInstitutions = useCallback(async () => {
    try {
      const instResponse = await api.get('/institutions');
      if (instResponse.success && instResponse.data) {
        setInstitutions(instResponse.data);
        return { success: true };
      } else {
        console.error('Failed to refresh institutions:', instResponse.message);
        return { success: false, message: instResponse.message };
      }
    } catch (err) {
      console.error('Error refreshing institutions:', err);
      return { success: false, message: 'Failed to refresh institutions' };
    }
  }, []);

  return (
    <ServiceContext.Provider value={{
      institutions,
      services,
      loading,
      error,
      searchLoading,
      searchError,
      getServicesByInstitution,
      getInstitutionById,
      getInstitutionByCode,
      getServiceById,
      searchServicesAndInstitutions,
      refreshInstitutions
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error('useServices must be used inside ServiceProvider');
  return ctx;
}
