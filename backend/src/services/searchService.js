import { supabase } from '../config/supabase.js';

/**
 * Search across institutions, services, and requirements
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export const search = async (query) => {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: 'Search query must be at least 2 characters long.'
      };
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Search institutions
    const { data: institutions } = await supabase
      .from('institutions')
      .select('id, name_en, name_am, description, code, logo_url')
      .or(`name_en.ilike.${searchTerm},name_am.ilike.${searchTerm},description.ilike.${searchTerm},code.ilike.${searchTerm}`)
      .eq('status', 'ACTIVE')
      .limit(10);

    // Search services
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        title_en,
        title_am,
        description_en,
        description_am,
        institution_id,
        service_fee,
        is_active,
        institutions (
          id,
          name_en,
          code
        )
      `)
      .or(`title_en.ilike.${searchTerm},title_am.ilike.${searchTerm},description_en.ilike.${searchTerm},description_am.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(20);

    // Map services to expected format
    const mappedServices = (services || []).map(service => ({
      id: service.id,
      name: service.title_en,
      name_am: service.title_am,
      description: service.description_en,
      description_am: service.description_am,
      institution_id: service.institution_id,
      fee_amount: service.service_fee,
      status: service.is_active ? 'ACTIVE' : 'INACTIVE',
      institutions: service.institutions
    }));

    // Search requirements
    const { data: requirements } = await supabase
      .from('service_requirements')
      .select(`
        id,
        document_name_en,
        document_name_am,
        service_id,
        services (
          id,
          title_en,
          institution_id,
          institutions (
            id,
            name_en
          )
        )
      `)
      .or(`document_name_en.ilike.${searchTerm},document_name_am.ilike.${searchTerm}`)
      .limit(15);

    // Map requirements to expected format
    const mappedRequirements = (requirements || []).map(req => ({
      id: req.id,
      requirement_en: req.document_name_en,
      requirement_am: req.document_name_am,
      service_id: req.service_id,
      services: req.services ? {
        ...req.services,
        name: req.services.title_en
      } : null
    }));

    return {
      success: true,
      data: {
        institutions: institutions || [],
        services: mappedServices || [],
        requirements: mappedRequirements || [],
        query: query.trim(),
        total: (institutions?.length || 0) + (mappedServices?.length || 0) + (mappedRequirements?.length || 0)
      }
    };

  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      message: 'An error occurred during search.'
    };
  }
};
