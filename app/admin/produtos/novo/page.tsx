'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category { id: number; name: string; parent_id: number | null; }

export default function NewProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', short_description: '', description: '', category_id: '',
    image_main: '', supplier: 'manual', supplier_sku: '',
    is_active: 1, is_featured: 0, is_new: 1,
    min_order: '', specs: '',
  });

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories);
  }, []);

  function updateField(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      min_order: form.min_order ? parseInt(form.min_order) : null,
      specs: form.specs ? JSON.parse(form.specs) : null,
    };
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/produtos/${data.id}`);
    }
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Produto</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select value={form.category_id} onChange={e => updateField('category_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Selecione...</option>
              {categories.filter(c => !c.parent_id).map(main => (
                <optgroup key={main.id} label={main.name}>
                  <option value={main.id}>{main.name} (geral)</option>
                  {categories.filter(c => c.parent_id === main.id).map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <select value={form.supplier} onChange={e => updateField('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="manual">Manual</option>
              <option value="spotgifts">SpotGifts</option>
              <option value="xbzbrindes">XBZ Brindes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descricao Curta</label>
          <input type="text" value={form.short_description} onChange={e => updateField('short_description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descricao Completa</label>
          <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={5} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Imagem Principal</label>
          <input type="text" value={form.image_main} onChange={e => updateField('image_main', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="/images/products/manual/produto.jpg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU Fornecedor</label>
            <input type="text" value={form.supplier_sku} onChange={e => updateField('supplier_sku', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Minimo</label>
            <input type="number" value={form.min_order} onChange={e => updateField('min_order', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Especificacoes (JSON)</label>
          <textarea value={form.specs} onChange={e => updateField('specs', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={3}
            placeholder='{"material": "Feltro", "dimensoes": "150x210mm"}' />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_active}
              onChange={e => updateField('is_active', e.target.checked ? 1 : 0)} />
            <span className="text-sm">Ativo</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_featured}
              onChange={e => updateField('is_featured', e.target.checked ? 1 : 0)} />
            <span className="text-sm">Destaque</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_new}
              onChange={e => updateField('is_new', e.target.checked ? 1 : 0)} />
            <span className="text-sm">Novo</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={saving}
            className="bg-lime-600 text-white px-6 py-2 rounded-lg hover:bg-lime-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Produto'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
