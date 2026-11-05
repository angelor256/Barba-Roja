import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Services() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data } = await supabase.from('services').select('*').order('sort_order').order('created_at');
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const patch = (id, k, v) => setList((l) => l.map((s) => (s.id === id ? { ...s, [k]: v, _dirty: true } : s)));

  const save = async (s) => {
    setMsg('');
    const payload = { name: s.name, description: s.description || null, price_crc: Number(s.price_crc), duration_min: Number(s.duration_min), active: s.active, sort_order: s.sort_order };
    const { error } = s.id.startsWith('new') ? await supabase.from('services').insert(payload) : await supabase.from('services').update(payload).eq('id', s.id);
    if (error) setMsg(error.message); else { setMsg('Guardado ✔'); load(); }
  };
  const remove = async (s) => {
    if (s.id.startsWith('new')) return setList((l) => l.filter((x) => x.id !== s.id));
    if (!confirm(`¿Eliminar “${s.name}”? Las citas pasadas conservan su registro.`)) return;
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    if (error) setMsg(error.message); else load();
  };
  const add = () => setList((l) => [...l, { id: 'new' + Date.now(), name: '', description: '', price_crc: 0, duration_min: 30, active: true, sort_order: l.length + 1, _dirty: true }]);

  return (
    <div className="space-y-3">
      <button onClick={add} className="btn-primary btn-sm"><Plus size={16} /> Nuevo servicio</button>
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      {list.map((s) => (
        <div key={s.id} className={`card grid items-end gap-2 sm:grid-cols-[1fr_7rem_6rem_auto] ${s.active ? '' : 'opacity-60'}`}>
          <div><label className="label">Nombre</label><input className="input" value={s.name} onChange={(e) => patch(s.id, 'name', e.target.value)} /></div>
          <div><label className="label">Precio ₡</label><input className="input" type="number" min="0" step="250" value={s.price_crc} onChange={(e) => patch(s.id, 'price_crc', e.target.value)} /></div>
          <div><label className="label">Minutos</label><input className="input" type="number" min="5" step="5" value={s.duration_min} onChange={(e) => patch(s.id, 'duration_min', e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="accent-brand" checked={s.active} onChange={(e) => patch(s.id, 'active', e.target.checked)} /> Activo</label>
            <button onClick={() => save(s)} disabled={!s._dirty || !s.name} className="btn-primary btn-sm" aria-label="Guardar"><Save size={14} /></button>
            <button onClick={() => remove(s)} className="btn-ghost btn-sm" aria-label="Eliminar"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
