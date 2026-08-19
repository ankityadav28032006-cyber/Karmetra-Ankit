import { GovernmentVacancy, GovtJobAlertPreference, MatchedGovtJobsResponse } from '../types';
import { BASE_URL } from './apiClient';

export interface GovtJobFilterParams {
  state?: string;
  jobType?: string;
  minEducation?: string;
  search?: string;
}

export const govtJobService = {
  async getGovtJobs(params?: GovtJobFilterParams): Promise<GovernmentVacancy[]> {
    try {
      const query = new URLSearchParams();
      if (params?.state && params.state !== 'All') query.set('state', params.state);
      if (params?.jobType && params.jobType !== 'All') query.set('jobType', params.jobType);
      if (params?.minEducation && params.minEducation !== 'All') query.set('minEducation', params.minEducation);
      if (params?.search) query.set('search', params.search);

      const res = await fetch(`${BASE_URL}/govt-jobs?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch government vacancies');
      const data = await res.json();
      return data.vacancies || [];
    } catch (err) {
      console.error('Error fetching govt jobs:', err);
      return [];
    }
  },

  async getGovtJobById(id: string): Promise<GovernmentVacancy | null> {
    try {
      const res = await fetch(`${BASE_URL}/govt-jobs/${id}`);
      if (!res.ok) throw new Error('Vacancy not found');
      const data = await res.json();
      return data.vacancy || null;
    } catch (err) {
      console.error('Error fetching govt vacancy:', err);
      return null;
    }
  },

  async toggleSaveGovtJob(id: string, token: string): Promise<{ saved: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/govt-jobs/${id}/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save government job');
    }

    return await res.json();
  },

  async getSavedGovtJobs(token: string): Promise<{ savedVacancies: GovernmentVacancy[]; savedIds: string[] }> {
    try {
      const res = await fetch(`${BASE_URL}/candidate/saved-govt-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch saved govt jobs');
      const data = await res.json();
      return {
        savedVacancies: data.savedVacancies || [],
        savedIds: data.savedIds || []
      };
    } catch (err) {
      console.error('Error fetching saved govt jobs:', err);
      return { savedVacancies: [], savedIds: [] };
    }
  },

  async getAlertPreferences(token: string): Promise<GovtJobAlertPreference | null> {
    try {
      const res = await fetch(`${BASE_URL}/candidate/govt-alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.preferences;
    } catch (err) {
      return null;
    }
  },

  async saveAlertPreferences(preferences: GovtJobAlertPreference, token: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/candidate/govt-alerts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preferences)
    });
    return res.ok;
  },

  /**
   * Cross-references user's state, education, and department preferences
   * with the active government jobs database.
   */
  async getMatchedGovtJobs(token: string): Promise<MatchedGovtJobsResponse | null> {
    try {
      const res = await fetch(`${BASE_URL}/candidate/matched-govt-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch matched government vacancies');
      return await res.json();
    } catch (err) {
      console.error('Error fetching matched govt jobs:', err);
      return null;
    }
  },

  /**
   * Scans and generates in-app notifications for newly matched state vacancies.
   */
  async triggerGovtAlertScan(token: string): Promise<{ success: boolean; createdCount: number } | null> {
    try {
      const res = await fetch(`${BASE_URL}/candidate/govt-alerts/trigger-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error triggering govt alert notification scan:', err);
      return null;
    }
  },

  // Admin APIs
  async getAllAdminGovtJobs(token: string): Promise<GovernmentVacancy[]> {
    const res = await fetch(`${BASE_URL}/admin/govt-jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch admin govt jobs');
    const data = await res.json();
    return data.vacancies || [];
  },

  async saveAdminGovtJob(vacancy: Partial<GovernmentVacancy>, token: string): Promise<GovernmentVacancy> {
    const isEdit = !!vacancy.id;
    const url = isEdit ? `${BASE_URL}/admin/govt-jobs/${vacancy.id}` : `${BASE_URL}/admin/govt-jobs`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vacancy)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save government vacancy');
    }

    const data = await res.json();
    return data.vacancy;
  },

  async deleteAdminGovtJob(id: string, token: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/admin/govt-jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete government vacancy');
    }

    return true;
  }
};
