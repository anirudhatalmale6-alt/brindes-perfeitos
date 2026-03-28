'use client';

import { useEffect, useState } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings);
  }, []);

  function update(key: string, value: string) {
    setSettings(s => ({ ...s, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields = [
    { key: 'site_name', label: 'Nome do Site' },
    { key: 'site_tagline', label: 'Slogan' },
    { key: 'contact_email', label: 'Email de Contato' },
    { key: 'contact_phone', label: 'Telefone' },
    { key: 'contact_whatsapp', label: 'WhatsApp' },
    { key: 'contact_address', label: 'Endereco' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuracoes</h1>

      <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 max-w-xl space-y-4">
        {saved && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">Configuracoes salvas!</div>}
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              type="text" value={settings[f.key] || ''}
              onChange={e => update(f.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </form>
    </div>
  );
}
