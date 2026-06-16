import { useState, FormEvent } from 'react';
import { useAuth, API } from '../App';

export default function Login() {
  const { login } = useAuth();
  const [siret, setSiret]   = useState('');
  const [pass, setPass]     = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]     = useState('');
  const [address, setAddress] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const body = isRegister
        ? { siret, password: pass, name, address }
        : { siret, password: pass };
      const res = await fetch(`${API}/merchant/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Erreur');
      login(data.token, data.merchant.id, data.merchant.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally { setLoading(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🔵</div>
        <h1 style={s.title}>Loto Seniors</h1>
        <p style={s.subtitle}>Espace Commerçant Partenaire</p>

        <div style={s.tabs}>
          <button style={isRegister ? s.tab : { ...s.tab, ...s.tabActive }} onClick={() => setIsRegister(false)}>Connexion</button>
          <button style={isRegister ? { ...s.tab, ...s.tabActive } : s.tab} onClick={() => setIsRegister(true)}>Inscription</button>
        </div>

        <form onSubmit={handleSubmit} style={s.form}>
          {isRegister && (
            <>
              <Field label="Nom de l'établissement" value={name} onChange={setName} placeholder="Boulangerie Martin" />
              <Field label="Adresse complète" value={address} onChange={setAddress} placeholder="12 rue de la République, 83400 Hyères" />
            </>
          )}
          <Field label="Numéro SIRET" value={siret} onChange={setSiret} placeholder="12345678901234" maxLength={14} />
          <Field label="Mot de passe" value={pass} onChange={setPass} type="password" placeholder="••••••••" />

          {error && <div style={s.error}>⚠️ {error}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Chargement…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p style={s.hint}>
          {isRegister
            ? 'Déjà inscrit ? '
            : 'Pas encore partenaire ? '}
          <span style={s.link} onClick={() => setIsRegister(r => !r)}>
            {isRegister ? 'Connectez-vous' : 'Rejoignez-nous gratuitement'}
          </span>
        </p>

        <div style={s.plans}>
          <p style={s.plansTitle}>Nos offres</p>
          <div style={s.plansRow}>
            <PlanChip name="Découverte" price="19€/mois" coupons="15 coupons" />
            <PlanChip name="Standard"   price="34€/mois" coupons="30 coupons" highlight />
            <PlanChip name="Premium"    price="59€/mois" coupons="60 coupons" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', placeholder='', maxLength }: { label:string; value:string; onChange:(v:string)=>void; type?:string; placeholder?:string; maxLength?:number }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:14, fontWeight:700, color:'#374151', marginBottom:6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:'2px solid #E5E7EB', fontSize:16, outline:'none', transition:'border .15s' }}
        onFocus={e => e.target.style.border='2px solid #C8A000'}
        onBlur={e => e.target.style.border='2px solid #E5E7EB'} required />
    </div>
  );
}

function PlanChip({ name, price, coupons, highlight }: { name:string; price:string; coupons:string; highlight?:boolean }) {
  return (
    <div style={{ flex:1, background: highlight ? '#2D5A27' : '#F9FAFB', borderRadius:10, padding:'12px 8px', textAlign:'center', border: highlight ? '2px solid #C8A000' : '2px solid #E5E7EB' }}>
      <div style={{ fontSize:13, fontWeight:900, color: highlight ? '#C8A000' : '#374151' }}>{name}</div>
      <div style={{ fontSize:18, fontWeight:900, color: highlight ? '#F5F0E0' : '#111827', margin:'4px 0' }}>{price}</div>
      <div style={{ fontSize:12, color: highlight ? '#C8A000' : '#6B7280' }}>{coupons}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:      { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'linear-gradient(135deg, #1A4A2A 0%, #2D5A27 100%)' },
  card:      { background:'#fff', borderRadius:20, padding:40, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  logo:      { fontSize:56, textAlign:'center', marginBottom:8 },
  title:     { fontSize:28, fontWeight:900, color:'#2D5A27', textAlign:'center', marginBottom:4 },
  subtitle:  { fontSize:14, color:'#6B7280', textAlign:'center', marginBottom:24 },
  tabs:      { display:'flex', background:'#F3F4F6', borderRadius:10, padding:4, marginBottom:24, gap:4 },
  tab:       { flex:1, padding:'10px 0', borderRadius:8, border:'none', background:'transparent', fontWeight:700, fontSize:14, color:'#6B7280', cursor:'pointer', transition:'all .15s' },
  tabActive: { background:'#fff', color:'#2D5A27', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' },
  form:      { display:'flex', flexDirection:'column' },
  error:     { background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:14, marginBottom:16 },
  btn:       { background:'#F08000', color:'#fff', border:'none', borderRadius:10, padding:'14px 0', fontSize:18, fontWeight:800, cursor:'pointer', marginTop:8 },
  hint:      { textAlign:'center', fontSize:14, color:'#6B7280', marginTop:16 },
  link:      { color:'#2D5A27', fontWeight:700, cursor:'pointer' },
  plans:     { marginTop:24, paddingTop:20, borderTop:'1px solid #E5E7EB' },
  plansTitle:{ fontSize:13, fontWeight:700, color:'#6B7280', textAlign:'center', marginBottom:12 },
  plansRow:  { display:'flex', gap:8 },
};
