'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Category { id: number; name: string; parent_id: number | null; }

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', short_description: '', description: '', category_id: '',
    image_main: '', supplier: 'manual', supplier_sku: '',
    is_active: 1, is_featured: 0, is_new: 0,
    min_order: '', specs: '', source_url: '', price: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch(`/api/products?search=&limit=1000`).then(r => r.json()),
    ]).then(([cats, prodData]) => {
      setCategories(cats);
      const product = prodData.products.find((p: { id: number }) => p.id === Number(id));
      if (product) {
        setForm({
          name: product.name || '',
          short_description: product.short_description || '',
          description: product.description || '',
          category_id: product.category_id ? String(product.category_id) : '',
          image_main: product.image_main || '',
          supplier: product.supplier || 'manual',
          supplier_sku: product.supplier_sku || '',
          is_active: product.is_active,
          is_featured: product.is_featured,
          is_new: product.is_new,
          min_order: product.min_order ? String(product.min_order) : '',
          specs: product.specs || '',
          source_url: product.source_url || '',
          price: product.price != null ? String(product.price) : '',
        });
        // Parse existing images
        try {
          const imgs = product.images ? JSON.parse(product.images) : [];
          setProductImages(Array.isArray(imgs) ? imgs : []);
        } catch { setProductImages([]); }
      }
      setLoading(false);
    });
  }, [id]);

  function updateField(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('product_id', String(id));
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.urls) {
        const newImages = [...productImages, ...data.urls];
        setProductImages(newImages);
        if (!form.image_main && data.urls.length > 0) {
          updateField('image_main', data.urls[0]);
        }
      }
    } catch (err) {
      alert('Erro ao enviar imagem: ' + err);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(idx: number) {
    const img = productImages[idx];
    const newImages = productImages.filter((_, i) => i !== idx);
    setProductImages(newImages);
    if (form.image_main === img && newImages.length > 0) {
      updateField('image_main', newImages[0]);
    } else if (form.image_main === img) {
      updateField('image_main', '');
    }
  }

  function setAsMain(url: string) {
    updateField('image_main', url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let specs = form.specs;
    try {
      if (specs && typeof specs === 'string') specs = JSON.parse(specs);
    } catch { /* keep as string */ }

    await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: Number(id),
        name: form.name,
        short_description: form.short_description,
        description: form.description,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        image_main: form.image_main,
        images: productImages,
        supplier: form.supplier,
        supplier_sku: form.supplier_sku,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_new: form.is_new,
        min_order: form.min_order ? parseInt(form.min_order) : null,
        price: form.price ? parseFloat(form.price) : null,
        specs,
        source_url: form.source_url,
      }),
    });
    setSaving(false);
    router.push('/admin/produtos');
  }

  if (loading) return <div className="text-gray-500">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Produto</h1>
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
            <a href="/admin/categorias" target="_blank" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              + Gerenciar categorias e subcategorias
            </a>
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

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <label className="block text-sm font-bold text-amber-800 mb-1">Preco de Custo (R$)</label>
          <input type="number" step="0.01" value={form.price} onChange={e => updateField('price', e.target.value)}
            placeholder="Ex: 5.50" className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white" />
          <p className="text-xs text-amber-600 mt-1">
            Para produtos Spot, insira o preco de custo manualmente. Produtos XBZ ja importam o preco da API.
          </p>
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

        {/* Image Management Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-bold text-gray-700 mb-3">Imagens do Produto</label>

          {/* Current images grid */}
          {productImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-3">
              {productImages.map((img, idx) => (
                <div key={idx} className={`relative group border-2 rounded-lg overflow-hidden ${form.image_main === img ? 'border-lime-500' : 'border-gray-200'}`}>
                  <img src={img} alt="" className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" onClick={() => setAsMain(img)}
                      title="Definir como principal"
                      className="bg-lime-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-lime-600">
                      ★
                    </button>
                    <button type="button" onClick={() => removeImage(idx)}
                      title="Remover"
                      className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-600">
                      X
                    </button>
                  </div>
                  {form.image_main === img && (
                    <span className="absolute top-1 left-1 bg-lime-500 text-white text-[10px] px-1 rounded">Principal</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <div className="flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload}
              className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {uploading ? 'Enviando...' : 'Enviar Imagens'}
            </button>
            <span className="text-xs text-gray-500">{productImages.length} imagem(ns)</span>
          </div>

          {/* Manual URL input */}
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Ou insira URL da imagem principal manualmente:</label>
            <input type="text" value={form.image_main} onChange={e => updateField('image_main', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://..." />
          </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Fonte</label>
          <input type="text" value={form.source_url} onChange={e => updateField('source_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Especificacoes (JSON)</label>
          <textarea value={form.specs} onChange={e => updateField('specs', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" rows={3} />
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
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
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
