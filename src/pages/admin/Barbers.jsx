import { useEffect, useState } from 'react';
import { Pencil, Plus, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';

const EMPTY = { name: '', nickname: '', specialty: '', bio: '', years: '', photo_url: '', active: true };

export default function Barbers() {
  const [list, setList] = useState([]);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    const { data } = await supabase.from('barbers').select('*').order('sort_order').order('created_at');
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (b) => { await supabase.from('barbers').update({ active: !b.active }).eq('id', b.id); load(); };

  return (
    <div className="space-y-4">
      <button onClick={() => setEdit({ ...EMPTY })} className="btn-primary btn-sm"><Plus size={16} /> Nuevo barbero</button>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <div key={b.id} className={`card flex items-center gap-3 ${b.active ? '' : 'opacity-50'}`}>
            {b.photo_url ? <img src={b.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              : <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-700"><User /></span>}
            <div className="min-w-0 flex-1">
              <p className="font-heading truncate text-lg">{b.name}</p>
              <p className="truncate text-xs text-neutral-400">{b.specialty || '—'}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEdit(b)} className="btn-ghost btn-sm" aria-label="Editar"><Pencil size={14} /></button>
              <button onClick={() => toggle(b)} className="btn-ghost btn-sm">{b.active ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        ))}
      </div>
      {edit && <BarberForm barber={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function BarberForm({ barber, onClose, onSaved }) {
  const [f, setF] = useState(barber);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    const path = `${crypto.randomUUID()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('barbers').upload(path, file, { contentType: file.type });
    if (error) setErr(error.message);
    else setF((x) => ({ ...x, photo_url: supabase.storage.from('barbers').getPublicUrl(path).data.publicUrl }));
    setBusy(false);
  };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const payload = { name: f.name, nickname: f.nickname || null, bio: f.bio || null, years: f.years ? Number(f.years) : null, specialty: f.specialty || null, photo_url: f.photo_url || null, active: f.active };
    const { error } = f.id ? await supabase.from('barbers').update(payload).eq('id', f.id) : await supabase.from('barbers').insert(payload);
    setBusy(false);
    if (error) setErr(error.message); else onSaved();
  };

  return (
    <Modal title={f.id ? 'Editar barbero' : 'Nuevo barbero'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div><label className="label">Nombre</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Apodo</label><input className="input" value={f.nickname ?? ''} onChange={(e) => setF({ ...f, nickname: e.target.value })} placeholder="El Rojo" /></div>
          <div><label className="label">Años de experiencia</label><input className="input" type="number" min="0" value={f.years ?? ''} onChange={(e) => setF({ ...f, years: e.target.value })} /></div>
        </div>
        <div><label className="label">Especialidad</label><input className="input" value={f.specialty ?? ''} onChange={(e) => setF({ ...f, specialty: e.target.value })} placeholder="Degradados, barba clásica…" /></div>
        <div><label className="label">Presentación (perfil público)</label><textarea className="input" rows={3} value={f.bio ?? ''} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        <div>
          <label className="label">Foto de perfil</label>
          {f.photo_url && <img src={f.photo_url} alt="" className="mb-2 h-20 w-20 rounded-full object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => upload(e.target.files[0])} className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-3 file:py-2 file:text-white" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="accent-brand" /> Activo (visible para reservas)</label>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>Guardar</button>
      </form>
    </Modal>
  );
}
