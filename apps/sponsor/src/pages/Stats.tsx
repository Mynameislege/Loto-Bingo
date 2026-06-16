import { useEffect, useState } from 'react';
import { useAuth, API } from '../App';

interface WeeklyData { date: string; distributed: number; redeemed: number; }
interface StatsDetail {
  couponsDistributed: number;
  couponsRedeemed: number;
  conversionRate: number;
  reach: number;
  acquisitionCost: number;
  weekly: WeeklyData[];
}

export default function Stats() {
  const { token } = useAuth();
  const [stats, setStats]   = useState<StatsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/merchant/my/stats/detail`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ padding:32, color:'#6B7280', fontSize:18 }}>Chargement des statistiques…</div>;

  const roi = stats ? ((stats.couponsRedeemed * 8) / (stats.couponsDistributed * (34/30))).toFixed(1) : '—';

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Statistiques</h1>

      {!stats ? (
        <div style={s.empty}>Aucune donnée disponible. Publiez votre première offre !</div>
      ) : (
        <>
          <div style={s.grid4}>
            <BigStat label="Coupons distribués"  value={stats.couponsDistributed} icon="🎟" color="#F08000" />
            <BigStat label="Coupons utilisés"    value={stats.couponsRedeemed}    icon="🛒" color="#43A047" />
            <BigStat label="Taux de conversion"  value={`${stats.conversionRate}%`} icon="📈" color="#1E88E5" desc="Objectif : > 20%" />
            <BigStat label="Coût d'acquisition" value={`${stats.acquisitionCost.toFixed(2)}€`} icon="💶" color="#9C27B0" desc="vs 15-25€ Google Ads" />
          </div>

          <div style={s.roiCard}>
            <p style={s.roiTitle}>Estimation ROI ce mois</p>
            <p style={s.roiValue}>×{roi}</p>
            <p style={s.roiSub}>CA estimé généré : {(stats.couponsRedeemed * 8).toFixed(0)}€ · Coût abonnement : ~34€/mois</p>
          </div>

          {stats.conversionRate < 20 && stats.couponsDistributed >= 5 && (
            <div style={s.tip}>
              💡 <strong>Conseil :</strong> Votre taux est en dessous de 20%. Essayez des offres bundle plutôt que des remises. Les joueurs seniors perçoivent davantage un "cadeau" qu'une promotion.
            </div>
          )}

          <h2 style={s.h2}>Activité des 7 derniers jours</h2>
          <div style={s.weekBar}>
            {(stats.weekly ?? []).map(w => (
              <div key={w.date} style={s.weekCol}>
                <div style={s.barWrap}>
                  <div style={{ ...s.bar, height:`${Math.min(100, (w.distributed/5)*100)}%`, background:'#F08000' }} title={`${w.distributed} distribués`} />
                  <div style={{ ...s.bar, height:`${Math.min(100, (w.redeemed/5)*100)}%`, background:'#43A047', marginLeft:3 }} title={`${w.redeemed} utilisés`} />
                </div>
                <span style={s.weekLabel}>{new Date(w.date).toLocaleDateString('fr-FR',{weekday:'short'})}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:20, fontSize:13, color:'#6B7280', marginTop:8 }}>
            <span><span style={{ display:'inline-block', width:12, height:12, background:'#F08000', borderRadius:3, marginRight:6 }}/>Distribués</span>
            <span><span style={{ display:'inline-block', width:12, height:12, background:'#43A047', borderRadius:3, marginRight:6 }}/>Utilisés</span>
          </div>
        </>
      )}
    </div>
  );
}

function BigStat({ label, value, icon, color, desc }: { label:string; value:string|number; icon:string; color:string; desc?:string }) {
  return (
    <div style={s.statCard}>
      <div style={{ fontSize:36, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:30, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:14, color:'#374151', fontWeight:700, marginTop:4 }}>{label}</div>
      {desc && <div style={{ fontSize:12, color:'#9CA3AF', marginTop:2 }}>{desc}</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:    { maxWidth:1100, margin:'0 auto', padding:32 },
  h1:      { fontSize:28, fontWeight:900, color:'#111827', marginBottom:32 },
  h2:      { fontSize:20, fontWeight:800, color:'#111827', margin:'32px 0 16px' },
  empty:   { background:'#F9FAFB', borderRadius:12, padding:40, textAlign:'center', color:'#6B7280', fontSize:16 },
  grid4:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 },
  statCard:{ background:'#fff', borderRadius:16, padding:24, textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid #F3F4F6' },
  roiCard: { background:'linear-gradient(135deg, #2D5A27, #43A047)', borderRadius:16, padding:32, textAlign:'center', color:'#fff', marginBottom:24 },
  roiTitle:{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.8)', marginBottom:8 },
  roiValue:{ fontSize:56, fontWeight:900, color:'#FFD700' },
  roiSub:  { fontSize:14, color:'rgba(255,255,255,0.8)', marginTop:8 },
  tip:     { background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'16px 20px', fontSize:15, color:'#92400E', marginBottom:24, lineHeight:1.6 },
  weekBar: { display:'flex', gap:8, height:140, alignItems:'flex-end', background:'#F9FAFB', borderRadius:12, padding:'20px 20px 0' },
  weekCol: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 },
  barWrap: { display:'flex', alignItems:'flex-end', height:100, gap:2 },
  bar:     { width:16, borderRadius:'4px 4px 0 0', minHeight:4, transition:'height .3s' },
  weekLabel:{ fontSize:11, color:'#9CA3AF', fontWeight:700 },
};
