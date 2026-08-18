import { DynamicJobCategory } from '../types';

export type JobCategoryDefinition = DynamicJobCategory;

export const categoryService = {
  async getCategories(showAll: boolean = false): Promise<DynamicJobCategory[]> {
    try {
      const res = await fetch(`/api/categories${showAll ? '?all=true' : ''}`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.categories || [];
    } catch (err) {
      console.error('Error fetching categories:', err);
      return [];
    }
  },

  async saveCategory(category: Partial<DynamicJobCategory>, token: string): Promise<DynamicJobCategory> {
    const isEdit = !!category.id;
    const url = isEdit ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(category)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save job category');
    }

    const data = await res.json();
    return data.category;
  },

  async deleteCategory(id: string, token: string): Promise<boolean> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete job category');
    }

    return true;
  }
};
