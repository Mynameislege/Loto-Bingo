import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../App';

interface Offer {
  id: string;
  description: string;
  stockMonthly: number;
  stockRemaining: number;
  dailyCap: number;
  expiresAt: string | null;
  active: boolean;
}

interface DashStats {
  couponsDistributed: number;
  couponsRedeemed: number;
  conversionRate: number;
  reach: number;
}

export default function Dashboard() {
  const { token, merchantName } = useAuth();
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [stats, setStats]     = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const plan = 'Standard'; // TODO: from API

  useEffect(() => {
    Promise.all([
      fetch(`${API}/merchant/my/offers`,  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/merchant/my/stats`,   { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([o, s]) => { setOffers(Array.isArray(o) ? o : []); setStats(s); })
      .catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={s.center}>Chargement…</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>Bonjour, {merchantName} 👋</h1>
          <p style={s.sub}>Tableau de bord · Offre <strong>{plan}</strong></p>
        </div>
        <Link to="/create-offer" style={s.newBtn}>+ Créer une offre</Link>
      </div>

      {/* Stats */}
      {stats && (
        <div style={s.statsRow}>
          <StatCard icon="🎟" label="Coupons distribués" value={stats.couponsDistributed} color="#F08000" />
          <StatCard icon="🛒" label="Coupons utilisés"   value={stats.couponsRedeemed}    color="#43A047" />
          <StatCard icon="📈" label="Taux de conversion" value={`${stats.conversionRate}%`} color="#1E88E5" />
          <StatCard icon="👁" label="Reach (joueurs)"    value={stats.reach}              color="#9C27B0" />
        </div>
      )}

      {/* Alerte conversion */}
      {stats && stats.conversionRate < 20 && stats.couponsDistributed > 5 && (
        <div style={s.alert}>
          ⚠️ Votre taux de conversion est en dessous de 20%. Essayez des offres bundle ("3 pour 2", "café offert") plutôt que des remises en %.
        </div>
      )}
      {stats && stats.conversionRate >= 20 && stats.couponsDistributed > 5 && (
        <div style={{ ...s.alert, background:'#F0FDF4', borderColor:'#86EFAC', color:'#15803D' }}>
          ✅ Excellent taux de conversion ({stats.conversionRate}%) ! Vos clients joueurs reviennent en boutique.
        </div>
      )}

      {/* Offres */}
      <h2 style={s.h2}>Mes offres actives</h2>
      {offers.length === 0 ? (
        <div style={s.empty}>
          <p style={{ fontSize:32, marginBottom:12 }}>🏪</p>
          <p style={{ fontWeight:700, color:'#374151', marginBottom:8 }}>Aucune offre en cours</p>
          <p style={{ color:'#6B7280', marginBottom:20 }}>Créez votre première offre — les joueurs de votre zone la verront immédiatement.</p>
          <Link to="/create-offer" style={s.newBtn}>Créer une offre</Link>
        </div>
      ) : (
        <div style={s.offerGrid}>
          {offers.map(offer => <OfferCard key={offer.id} offer={offer} token={token!} onRefresh={() => window.location.reload()} />)}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer, token, onRefresh }: { offer: Offer; token: string; onRefresh: () => void }) {
  const pct = Math.round(((offer.stockMonthly - offer.stockRemaining) / offer.stockMonthly) * 100);
  const exp = offer.expiresAt ? new Date(offer.expiresAt).toLocaleDateString('fr-FR') : 'Sans limite';

  async function toggleActive() {
    await fetch(`${API}/merchant/offers/${offer.id}/toggle`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  return (
    <div style={{ ...s.offerCard, opacity: offer.active ? 1 : 0.6 }}>
      <div style={s.offerHeader}>
        <span style={{ fontSize:13, fontWeight:700, color: offer.active ? '#15803D' : '#6B7280' }}>
          {offer.active ? '🟢 Active' : '⏸ Pause'}
        </span>
        <button onClick={toggleActive} style={{ ...s.toggleBtn, background: offer.active ? '#FEF2F2' : '#F0FDF4', color: offer.active ? '#DC2626' : '#15803D' }}>
          {offer.active ? 'Mettre en pause' : 'Réactiver'}
        </button>
      </div>
      <p style={s.offerDesc}>{offer.description}</p>
      <div style={s.offerMeta}>
        <span>📦 Cap/jour : {offer.dailyCap}</span>
        <span>📅 Expire : {exp}</span>
      </div>
      <div style={{ marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#6B7280', marginBottom:4 }}>
          <span>Stock utilisé</span>
          <span>{offer.stockMonthly - offer.stockRemaining} / {offer.stockMonthly}</span>
        </div>
        <div style={{ height:8, background:'#E5E7EB', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background: pct > 80 ? '#DC2626' : '#43A047', borderRadius:4 }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon:string; label:string; value:string|number; color:string }) {
  return (
    <div style={s.statCard}>
      <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:13, color:'#6B7280', marginTop:4 }}>{label}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:      { maxWidth:1100, margin:'0 auto', padding:32 },
  center:    { display:'flex', alignItems:'center', justifyContent:'center', height:300, fontSize:18, color:'#6B7280' },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 },
  h1:        { fontSize:28, fontWeight:900, color:'#111827', marginBottom:4 },
  sub:       { fontSize:15, color:'#6B7280' },
  h2:        { fontSize:20, fontWeight:800, color:'#111827', marginBottom:16 },
  newBtn:    { background:'#F08000', color:'#fff', padding:'12px 24px', borderRadius:12, fontWeight:800, fontSize:15, display:'inline-block', textDecoration:'none' },
  statsRow:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
  statCard:  { background:'#fff', borderRadius:16, padding:24, textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6' },
  alert:     { background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'14px 20px', fontSize:14, color:'#92400E', marginBottom:24 },
  empty:     { background:'#fff', borderRadius:16, padding:40, textAlign:'center', border:'2px dashed #E5E7EB' },
  offerGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 },
  offerCard: { background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6' },
  offerHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  offerDesc: { fontSize:16, fontWeight:700, color:'#111827', marginBottom:8 },
  offerMeta: { display:'flex', gap:16, fontSize:13, color:'#6B7280' },
  toggleBtn: { border:'none', borderRadius:8, padding:'6px 12px', fontWeight:700, fontSize:13, cursor:'pointer' },
};
