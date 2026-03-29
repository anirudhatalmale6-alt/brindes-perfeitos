'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: number; name: string; slug: string; description: string;
  parent_id: number | null; parent_name: string | null;
  is_active: number; product_count: number; sort_order: number;
  children_count: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [newCat, setNewCat] = useState({ name: '', description: '', parent_id: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '', parent_id: '' });

  async function load() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  }

  useEffect(() => { load(); }, []);

  // Get only main categories (for parent selector)
  const mainCategories = categories.filter(c => !c.parent_id);

  // Organize: main categories first, then their children indented
  const organized: Category[] = [];
  mainCategories.forEach(main => {
    organized.push(main);
    categories.filter(c => c.parent_id === main.id).forEach(sub => {
      organized.push(sub);
    });
  });
  // Add orphans (no parent, not a main - shouldn't happen but safe)
  categories.filter(c => c.parent_id && !categories.find(m => m.id === c.parent_id)).forEach(c => {
    organized.push(c);
  });

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.name) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCat.name,
        description: newCat.description,
        parent_id: newCat.parent_id ? parseInt(newCat.parent_id) : null,
      }),
    });
    setNewCat({ name: '', description: '', parent_id: '' });
    load();
  }

  async function saveEdit(id: number) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: editForm.name,
        description: editForm.description,
        parent_id: editForm.parent_id ? parseInt(editForm.parent_id) : null,
      }),
    });
    setEditing(null);
    load();
  }

  async function toggleActive(id: number, current: number) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: current ? 0 : 1 }),
    });
    load();
  }

  async function deleteCategory(id: number) {
    if (!confirm('Excluir esta categoria? Subcategorias e produtos serao desvinculados.')) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categorias</h1>

      <form onSubmit={addCategory} className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <input type="text" placeholder="Nome da categoria" value={newCat.name}
            onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          <select value={newCat.parent_id} onChange={e => setNewCat(n => ({ ...n, parent_id: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Categoria principal</option>
            {mainCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="text" placeholder="Descricao (opcional)" value={newCat.description}
            onChange={e => setNewCat(n => ({ ...n, description: e.target.value }))}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
            + Adicionar
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {organized.map(c => (
              <tr key={c.id} className={`border-b hover:bg-gray-50 ${c.parent_id ? 'bg-gray-50/50' : ''}`}>
                <td className="px-4 py-3">
                  {editing === c.id ? (
                    <div className="space-y-2">
                      <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="px-2 py-1 border rounded text-sm w-full" />
                      <select value={editForm.parent_id} onChange={e => setEditForm(f => ({ ...f, parent_id: e.target.value }))}
                        className="px-2 py-1 border rounded text-sm w-full">
                        <option value="">Categoria principal</option>
                        {mainCategories.filter(m => m.id !== c.id).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className={`font-medium text-sm ${c.parent_id ? 'pl-6 text-gray-600' : 'text-gray-900'}`}>
                      {c.parent_id ? '└ ' : ''}{c.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {c.parent_id ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">Subcategoria</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                      Principal {c.children_count > 0 && `(${c.children_count} sub)`}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.product_count}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c.id, c.is_active)}
                    className={`text-xs px-2 py-1 rounded ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? 'Ativa' : 'Inativa'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {editing === c.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(c.id)} className="text-green-600 text-sm">Salvar</button>
                      <button onClick={() => setEditing(null)} className="text-gray-500 text-sm">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(c.id); setEditForm({ name: c.name, description: c.description, parent_id: c.parent_id ? String(c.parent_id) : '' }); }}
                        className="text-lime-600 text-sm">Editar</button>
                      <button onClick={() => deleteCategory(c.id)} className="text-red-600 text-sm">Excluir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
