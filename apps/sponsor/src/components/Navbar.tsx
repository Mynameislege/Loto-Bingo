import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

export default function Navbar() {
  const { merchantName, logout } = useAuth();
  const loc = useLocation();
  const active = (p: string) => loc.pathname === p ? 'nav-link active' : 'nav-link';
  return (
    <nav style={nav.bar}>
      <div style={nav.brand}>
        <span style={nav.dot}>🔵</span>
        <span style={nav.title}>Loto Seniors</span>
        <span style={nav.sub}>Espace Commerçant</span>
      </div>
      <div style={nav.links}>
        <Link className={active('/')} to="/">Tableau de bord</Link>
        <Link className={active('/create-offer')} to="/create-offer">Créer une offre</Link>
        <Link className={active('/stats')} to="/stats">Statistiques</Link>
      </div>
      <div style={nav.right}>
        <span style={nav.merchant}>{merchantName}</span>
        <button style={nav.logout} onClick={logout}>Déconnexion</button>
      </div>
      <style>{`
        .nav-link { color: rgba(245,240,224,0.7); text-decoration:none; padding:8px 14px; border-radius:8px; font-weight:700; font-size:14px; transition:all .15s; }
        .nav-link:hover, .nav-link.active { color:#F5F0E0; background:rgba(200,160,0,0.2); }
      `}</style>
    </nav>
  );
}

const nav: Record<string, React.CSSProperties> = {
  bar:      { display:'flex', alignItems:'center', background:'#2D5A27', padding:'0 24px', height:64, gap:32, borderBottom:'3px solid #C8A000', position:'sticky', top:0, zIndex:100 },
  brand:    { display:'flex', alignItems:'center', gap:10, marginRight:8 },
  dot:      { fontSize:28 },
  title:    { fontSize:18, fontWeight:900, color:'#F5F0E0', whiteSpace:'nowrap' },
  sub:      { fontSize:12, color:'#C8A000', fontWeight:700, whiteSpace:'nowrap' },
  links:    { display:'flex', gap:4, flex:1 },
  right:    { display:'flex', alignItems:'center', gap:12 },
  merchant: { fontSize:14, color:'#C8A000', fontWeight:700 },
  logout:   { background:'transparent', border:'2px solid rgba(200,160,0,0.4)', color:'#C8A000', padding:'6px 14px', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' },
};
