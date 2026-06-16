import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';

const PLANS = {
  decouverte: { label:'Découverte', max:15 },
  standard:   { label:'Standard',   max:30 },
  premium:    { label:'Premium',    max:60 },
};

export default function CreateOffer() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [desc,       setDesc]     = useState('');
  const [stock,      setStock]    = useState(15);
  const [dailyCap,   setDailyCap] = useState(2);
  const [expiresAt,  setExpires]  = useState('');
  const [error,      setError]    = useState('');
  const [loading,    setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/merchant/offers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, stockMonthly: stock, dailyCap, expiresAt: expiresAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally { setLoading(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.h1}>Créer une offre</h1>
        <p style={s.sub}>Rédigez votre offre en texte libre. Les offres bundle fonctionnent mieux que les remises en %.</p>

        <div style={s.examples}>
          <p style={s.exTitle}>💡 Exemples qui convertissent</p>
          {[
            '3 baguettes pour le prix de 2',
            'Tarte citron offerte avec votre sandwich',
            'Café et croissant à 2€ le matin',
            '10% sur l'addition pour les joueurs Loto Seniors',
            '1 entrée offerte pour 2 plats commandés',
          ].map(ex => (
            <button key={ex} style={s.exBtn} onClick={() => setDesc(ex)}>{ex}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Votre offre (texte libre) *</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex : 3 baguettes pour le prix de 2"
              style={s.textarea} rows={3} required maxLength={200} />
            <span style={s.charCount}>{desc.length}/200</span>
          </div>

          <div style={s.row}>
            <div style={{ flex:1 }}>
              <label style={s.label}>Stock mensuel *</label>
              <input type="number" value={stock} onChange={e => setStock(+e.target.value)} min={1} max={60} style={s.input} required />
              <span style={s.hint}>Max selon votre abonnement</span>
            </div>
            <div style={{ flex:1 }}>
              <label style={s.label}>Cap par jour *</label>
              <input type="number" value={dailyCap} onChange={e => setDailyCap(+e.target.value)} min={1} max={stock} style={s.input} required />
              <span style={s.hint}>Coupons distribués max/jour</span>
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Date d'expiration (optionnel)</label>
            <input type="date" value={expiresAt} onChange={e => setExpires(e.target.value)} style={s.input}
              min={new Date().toISOString().slice(0,10)} />
          </div>

          <div style={s.preview}>
            <p style={s.previewTitle}>Aperçu dans l'app</p>
            <div style={s.previewCard}>
              <span style={s.previewMerchant}>Votre établissement</span>
              <p style={s.previewDesc}>{desc || 'Votre offre apparaîtra ici…'}</p>
              <span style={s.previewStock}>🔥 Stock : {stock} ce mois</span>
            </div>
          </div>

          {error && <div style={s.error}>⚠️ {error}</div>}

          <div style={s.btnRow}>
            <button type="button" style={s.cancel} onClick={() => navigate('/')}>Annuler</button>
            <button type="submit" style={s.submit} disabled={loading}>{loading ? 'Création…' : 'Publier l'offre'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:         { maxWidth:720, margin:'0 auto', padding:32 },
  card:         { background:'#fff', borderRadius:20, padding:40, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  h1:           { fontSize:26, fontWeight:900, color:'#111827', marginBottom:8 },
  sub:          { fontSize:15, color:'#6B7280', marginBottom:28, lineHeight:1.6 },
  form:         { display:'flex', flexDirection:'column', gap:20 },
  field:        { display:'flex', flexDirection:'column', gap:6 },
  row:          { display:'flex', gap:20 },
  label:        { fontSize:14, fontWeight:700, color:'#374151' },
  input:        { padding:'12px 14px', borderRadius:10, border:'2px solid #E5E7EB', fontSize:16, outline:'none', width:'100%' },
  textarea:     { padding:'12px 14px', borderRadius:10, border:'2px solid #E5E7EB', fontSize:16, outline:'none', resize:'vertical', width:'100%' },
  charCount:    { fontSize:12, color:'#9CA3AF', textAlign:'right' as const },
  hint:         { fontSize:12, color:'#9CA3AF', marginTop:4 },
  examples:     { background:'#F0FDF4', borderRadius:12, padding:20, marginBottom:24 },
  exTitle:      { fontSize:14, fontWeight:700, color:'#15803D', marginBottom:12 },
  exBtn:        { display:'block', width:'100%', textAlign:'left' as const, background:'#fff', border:'1px solid #BBF7D0', borderRadius:8, padding:'10px 14px', fontSize:14, color:'#374151', cursor:'pointer', marginBottom:6 },
  preview:      { background:'#F9FAFB', borderRadius:12, padding:20 },
  previewTitle: { fontSize:13, fontWeight:700, color:'#6B7280', marginBottom:12 },
  previewCard:  { background:'#fff', borderRadius:10, padding:16, borderLeft:'4px solid #C8A000' },
  previewMerchant: { fontSize:12, fontWeight:700, color:'#C8A000' },
  previewDesc:  { fontSize:15, fontWeight:700, color:'#111827', margin:'6px 0 4px' },
  previewStock: { fontSize:12, color:'#6B7280' },
  error:        { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'12px 16px', color:'#DC2626', fontSize:14 },
  btnRow:       { display:'flex', gap:12, justifyContent:'flex-end' },
  cancel:       { background:'#F3F4F6', color:'#374151', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:700, fontSize:15, cursor:'pointer' },
  submit:       { background:'#F08000', color:'#fff', border:'none', borderRadius:10, padding:'12px 24px', fontWeight:800, fontSize:15, cursor:'pointer' },
};
