'use client';

import { useState, useEffect } from 'react';

interface InlineEditorProps {
  productId: number;
  field: 'description' | 'short_description' | 'name';
  value: string;
  label: string;
  multiline?: boolean;
}

export default function InlineEditor({ productId, field, value, label, multiline = false }: InlineEditorProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Check if admin cookie exists
    setIsAdmin(document.cookie.includes('is_admin='));
  }, []);

  if (!isAdmin) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, [field]: text }),
      });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar');
    }
    setSaving(false);
  }

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          title={`Editar ${label}`}
        >
          Editar {label}
        </button>
        {saved && <span className="text-xs text-green-600">Salvo!</span>}
      </div>
    );
  }

  return (
    <div className="mt-2 border border-blue-300 rounded-lg p-3 bg-blue-50">
      <label className="block text-xs font-medium text-blue-700 mb-1">Editando: {label}</label>
      {multiline ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          rows={6}
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      )}
      <div className="flex gap-2 mt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={() => { setEditing(false); setText(value || ''); }}
          className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400">
          Cancelar
        </button>
      </div>
    </div>
  );
}
