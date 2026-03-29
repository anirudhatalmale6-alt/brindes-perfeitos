'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: number; name: string; slug: string; description: string;
  is_active: number; product_count: number; sort_order: number;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  async function load() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.name) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    });
    setNewCat({ name: '', description: '' });
    load();
  }

  async function saveEdit(id: number) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
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
    if (!confirm('Excluir esta categoria?')) return;
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

      <form onSubmit={addCategory} className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
        <input type="text" placeholder="Nome da categoria" value={newCat.name}
          onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
        <input type="text" placeholder="Descricao (opcional)" value={newCat.description}
          onChange={e => setNewCat(n => ({ ...n, description: e.target.value }))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
          + Adicionar
        </button>
      </form>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editing === c.id ? (
                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm" />
                  ) : (
                    <span className="font-medium text-sm">{c.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.slug}</td>
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
                      <button onClick={() => { setEditing(c.id); setEditForm({ name: c.name, description: c.description }); }}
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
