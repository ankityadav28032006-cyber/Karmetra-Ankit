import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Layers, 
  Tag, 
  Save, 
  X, 
  AlertCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { DynamicJobCategory } from '../../types';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';

export const AdminJobCategories: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<DynamicJobCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Partial<DynamicJobCategory> | null>(null);
  const [subCategoryInput, setSubCategoryInput] = useState<string>('');
  const [skillInput, setSkillInput] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const token = localStorage.getItem('km_auth_token') || '';

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories(true);
      setCategories(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load job categories' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory({
      name: '',
      nameHi: '',
      slug: '',
      icon: 'Briefcase',
      subCategories: [],
      suggestedSkills: [],
      displayOrder: categories.length + 1,
      isActive: true
    });
    setSubCategoryInput('');
    setSkillInput('');
  };

  const handleOpenEdit = (cat: DynamicJobCategory) => {
    setEditingCategory({ ...cat });
    setSubCategoryInput('');
    setSkillInput('');
  };

  const handleAddSubCategory = () => {
    if (!subCategoryInput.trim() || !editingCategory) return;
    const current = editingCategory.subCategories || [];
    if (!current.includes(subCategoryInput.trim())) {
      setEditingCategory({
        ...editingCategory,
        subCategories: [...current, subCategoryInput.trim()]
      });
    }
    setSubCategoryInput('');
  };

  const handleRemoveSubCategory = (sub: string) => {
    if (!editingCategory) return;
    setEditingCategory({
      ...editingCategory,
      subCategories: (editingCategory.subCategories || []).filter(s => s !== sub)
    });
  };

  const handleAddSkill = () => {
    if (!skillInput.trim() || !editingCategory) return;
    const current = editingCategory.suggestedSkills || [];
    if (!current.includes(skillInput.trim())) {
      setEditingCategory({
        ...editingCategory,
        suggestedSkills: [...current, skillInput.trim()]
      });
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    if (!editingCategory) return;
    setEditingCategory({
      ...editingCategory,
      suggestedSkills: (editingCategory.suggestedSkills || []).filter(s => s !== skill)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) return;

    setSaving(true);
    setStatusMessage(null);
    try {
      await categoryService.saveCategory(editingCategory, token);
      setStatusMessage({ type: 'success', text: `Category "${editingCategory.name}" saved successfully.` });
      setEditingCategory(null);
      await loadCategories();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving category' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? This action is permanent.`)) {
      return;
    }
    try {
      await categoryService.deleteCategory(id, token);
      setStatusMessage({ type: 'success', text: `Category "${name}" deleted.` });
      await loadCategories();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting category' });
    }
  };

  const handleToggleActive = async (cat: DynamicJobCategory) => {
    try {
      await categoryService.saveCategory({ ...cat, isActive: !cat.isActive }, token);
      await loadCategories();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating status' });
    }
  };

  const filteredCategories = categories.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.nameHi && c.nameHi.toLowerCase().includes(q)) ||
      c.subCategories.some(s => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-md border border-teal-200">
              System Taxonomy
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {categories.length} Categories Configured
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Job Categories & Domains</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure industry sectors, medical lines, skilled trades, household roles, IT and field categories. Employers and candidates filter positions by these dynamic taxonomies.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={loadCategories}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex-1 md:flex-none px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories (e.g. Healthcare, Nurse, Electrician, IT)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 font-medium"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading dynamic categories...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-bold text-slate-600">No categories found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new job category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.id}
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                cat.isActive ? 'border-slate-200 hover:border-teal-300' : 'border-slate-200 bg-slate-50/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Order #{cat.displayOrder}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.nameHi && (
                        <span className="text-xs font-normal text-slate-500">({cat.nameHi})</span>
                      )}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      cat.isActive 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Subcategories */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Roles / Subcategories ({cat.subCategories?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {(cat.subCategories || []).map((sub, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Skills */}
                {cat.suggestedSkills && cat.suggestedSkills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1.5">
                      Suggested ATS Skills
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                      {cat.suggestedSkills.slice(0, 6).map((sk, idx) => (
                        <span
                          key={idx}
                          className="bg-teal-50 text-teal-800 text-[10px] font-medium px-2 py-0.5 rounded-md"
                        >
                          {sk}
                        </span>
                      ))}
                      {cat.suggestedSkills.length > 6 && (
                        <span className="text-[10px] text-slate-400 font-bold self-center">
                          +{cat.suggestedSkills.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                  {editingCategory.id ? 'Modify Category' : 'Create Category'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {editingCategory.id ? editingCategory.name : 'New Job Category'}
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    placeholder="e.g. Healthcare / Medical"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category Name (Hindi / Regional)
                  </label>
                  <input
                    type="text"
                    value={editingCategory.nameHi || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nameHi: e.target.value })}
                    placeholder="e.g. चिकित्सा / स्वास्थ्य सेवा"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingCategory.displayOrder ?? 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={editingCategory.isActive ?? true}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                    className="accent-teal-600 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="catIsActive" className="font-bold text-slate-800 cursor-pointer">
                    Enable & Make Active
                  </label>
                </div>
              </div>

              {/* Subcategories tag input */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Job Roles / Subcategories
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={subCategoryInput}
                    onChange={(e) => setSubCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubCategory(); } }}
                    placeholder="Type subcategory (e.g. Nurse, Pharmacist) & press Add"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubCategory}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                  >
                    Add Role
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {(editingCategory.subCategories || []).map((sub, idx) => (
                    <span
                      key={idx}
                      className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{sub}</span>
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveSubCategory(sub)}
                      />
                    </span>
                  ))}
                  {(!editingCategory.subCategories || editingCategory.subCategories.length === 0) && (
                    <span className="text-slate-400 italic text-[11px]">No subcategories added yet.</span>
                  )}
                </div>
              </div>

              {/* Suggested Skills tag input */}
              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Suggested Skills (For ATS Matching)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    placeholder="Type skill & press Add"
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl"
                  >
                    Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-teal-50/40 border border-teal-100 rounded-xl">
                  {(editingCategory.suggestedSkills || []).map((sk, idx) => (
                    <span
                      key={idx}
                      className="bg-white border border-teal-200 text-teal-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{sk}</span>
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleRemoveSkill(sk)}
                      />
                    </span>
                  ))}
                  {(!editingCategory.suggestedSkills || editingCategory.suggestedSkills.length === 0) && (
                    <span className="text-slate-400 italic text-[11px]">No skills added yet.</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
