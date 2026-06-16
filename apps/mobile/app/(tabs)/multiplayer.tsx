/**
 * Onglet Multijoueur — Loto Seniors
 * Socket.io temps réel, boules B/I/N/G/O, Marcel, carton interactif.
 * Vision produit v6 :
 *  - 10 joueurs (réels + fantômes), matchmaking < 15s
 *  - Coupon au 1er Bingo uniquement
 *  - Salle Famille : code invitation + WebRTC (Agora — prochainement)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { generateCard, checkCard } from '@loto-seniors/game-engine';
import type { Card, CheckResult } from '@loto-seniors/game-engine';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import Marcel, { type MarcelMood, pickQuote } from '@/components/Marcel';
import ConfettiBingo from '@/components/ConfettiBingo';
import { useSound } from '@/hooks/useSound';

// ── Constantes matchmaking ────────────────────────────────────────────────────
const TOTAL_PLAYERS    = 10;
const GHOST_FILL_DELAY = 10_000;
const GAME_START_DELAY = 15_000;
const AUTO_DRAW_SECS   = 4;

const GHOST_NAMES = [
  'Jean-Pierre','Marie-Hélène','Colette','Roger','Germaine',
  'Marcel','Yvette','René','Louisette','Gaston',
  'Simone','André','Madeleine','Fernand','Odette',
  'Bernard','Huguette','Gérard','Monique','Raymond',
];
function pickGhosts(n: number, exclude: string) {
  return [...GHOST_NAMES].filter(g => g !== exclude).sort(() => Math.random()-0.5).slice(0, n);
}

// ── Boules B/I/N/G/O ─────────────────────────────────────────────────────────
interface BallSpec { letter:string; bg:string; bg2:string; border:string; textColor:string; bandColor:string; }
function getBallSpec(n: number): BallSpec {
  if (n<=18) return { letter:'B', bg:'#E53935', bg2:'#B71C1C', border:'#8B0000', textColor:'#fff', bandColor:'rgba(255,255,255,0.92)' };
  if (n<=36) return { letter:'I', bg:'#1E88E5', bg2:'#0D47A1', border:'#083180', textColor:'#fff', bandColor:'rgba(255,255,255,0.92)' };
  if (n<=54) return { letter:'N', bg:'#F5F5F5', bg2:'#BDBDBD', border:'#9E9E9E', textColor:'#212121', bandColor:'rgba(100,100,100,0.15)' };
  if (n<=72) return { letter:'G', bg:'#43A047', bg2:'#1B5E20', border:'#0A3D0A', textColor:'#fff', bandColor:'rgba(255,255,255,0.92)' };
  return             { letter:'O', bg:'#FB8C00', bg2:'#E65100', border:'#BF360C', textColor:'#fff', bandColor:'rgba(255,255,255,0.92)' };
}
function LotoBall({ number, size=40 }: { number:number; size?:number }) {
  const spec = getBallSpec(number);
  const bandH=size*0.38; const bTop=(size-bandH)/2;
  const ls=size<44?8:11; const ns=size<44?11:16;
  return (
    <View style={[bst.outer,{width:size,height:size,borderRadius:size/2,backgroundColor:spec.bg,borderColor:spec.border,shadowColor:spec.bg2}]}>
      <View style={[bst.band,{top:bTop,height:bandH,backgroundColor:spec.bandColor}]}/>
      <View style={[bst.shine,{width:size*0.26,height:size*0.18,top:size*0.12,left:size*0.18}]}/>
      <View style={bst.content}>
        <Text style={[bst.letter,{fontSize:ls,color:spec.textColor}]}>{spec.letter}</Text>
        <Text style={[bst.num,   {fontSize:ns,color:spec.textColor}]}>{number}</Text>
      </View>
    </View>
  );
}
const bst=StyleSheet.create({
  outer:{justifyContent:'center',alignItems:'center',borderWidth:2,shadowOffset:{width:0,height:3},shadowOpacity:0.4,shadowRadius:6,elevation:6,overflow:'hidden'},
  band:{position:'absolute',left:0,right:0},
  shine:{position:'absolute',borderRadius:50,backgroundColor:'rgba(255,255,255,0.55)'},
  content:{alignItems:'center',justifyContent:'center',zIndex:2},
  letter:{fontWeight:'900',lineHeight:14},
  num:{fontWeight:'900',lineHeight:18,marginTop:-2},
});

// ── Carton ────────────────────────────────────────────────────────────────────
function CardGrid({ card, drawn, result }: { card:Card; drawn:number[]; result:CheckResult }) {
  const drawnSet = new Set(drawn);
  const completedRows = card.map(row => row.filter((c): c is number => c!==null).every(n => drawnSet.has(n)));
  return (
    <View style={cst.grid}>
      {card.map((row, ri) => (
        <View key={ri} style={[cst.row, completedRows[ri] && cst.rowDone]}>
          {row.map((cell, ci) => {
            const hit = cell!==null && drawnSet.has(cell);
            return (
              <View key={ci} style={[cst.cell, cell===null&&cst.blank, hit&&cst.hit]}>
                {cell!==null && (hit ? <LotoBall number={cell} size={28}/> : <Text style={cst.num}>{cell}</Text>)}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
const cst=StyleSheet.create({
  grid:{marginHorizontal:Spacing.lg,marginBottom:12,borderRadius:Radius.md,overflow:'hidden',backgroundColor:Colors.surface,...Shadow.card},
  row:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:Colors.woodMid},
  rowDone:{backgroundColor:'rgba(67,160,71,0.15)'},
  cell:{flex:1,aspectRatio:1,justifyContent:'center',alignItems:'center',borderRightWidth:1,borderRightColor:Colors.woodMid},
  blank:{backgroundColor:Colors.woodMid,opacity:0.3},
  hit:{backgroundColor:'rgba(240,128,0,0.12)'},
  num:{fontSize:13,fontWeight:'700',color:Colors.text},
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface Player { name:string; isGhost:boolean; isHost?:boolean; hasLine?:boolean; hasQuine?:boolean; hasBingo?:boolean; }
type Screen = 'menu'|'family_join'|'waiting_public'|'waiting_family'|'in_game';

// ── Screen principal ───────────────────────────────────────────────────────────
export default function MultiplayerScreen() {
  const { user } = useAuthStore();
  const { play, playAmbience, stopAmbience } = useSound();

  const [screen,      setScreen]     = useState<Screen>('menu');
  const [roomCode,    setRoomCode]   = useState('');
  const [players,     setPlayers]    = useState<Player[]>([]);
  const [loading,     setLoading]    = useState(false);
  const [countdown,   setCountdown]  = useState<number|null>(null);
  const [roomId,      setRoomId]     = useState<string|null>(null);
  const [sessionId,   setSessionId]  = useState<string|null>(null);

  // Game state (in_game)
  const [card,        setCard]       = useState<Card|null>(null);
  const [drawn,       setDrawn]      = useState<number[]>([]);
  const [result,      setResult]     = useState<CheckResult>({line:false,quine:false,bingo:false});
  const [bingoWinner, setBingoWinner]= useState<string|null>(null);
  const [couponWon,   setCouponWon]  = useState(false);
  const [drawCountdown, setDrawCountdown] = useState(AUTO_DRAW_SECS);
  const [marcelMsg,   setMarcelMsg]  = useState<string|null>(null);
  const [marcelMood,  setMarcelMood] = useState<MarcelMood>('neutral');
  const [marcelVis,   setMarcelVis]  = useState(false);

  // Refs
  const socketRef      = useRef<Socket|null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval>|null>(null);
  const fillRef        = useRef<ReturnType<typeof setTimeout>|null>(null);
  const startRef       = useRef<ReturnType<typeof setTimeout>|null>(null);
  const drawRef        = useRef<ReturnType<typeof setInterval>|null>(null);
  const marcelTimer    = useRef<ReturnType<typeof setTimeout>|null>(null);
  const drawnRef       = useRef<number[]>([]);
  const resultRef      = useRef<CheckResult>({line:false,quine:false,bingo:false});
  const claimedRef     = useRef({line:false,quine:false,bingo:false});

  function clearTimers() {
    [countdownRef, fillRef, startRef, drawRef].forEach(r => {
      if (r.current) { clearInterval(r.current as ReturnType<typeof setInterval>); r.current=null; }
    });
  }
  useEffect(() => () => { clearTimers(); socketRef.current?.disconnect(); }, []);

  function showMarcel(msg:string, mood:MarcelMood, ms=4000) {
    if (marcelTimer.current) clearTimeout(marcelTimer.current);
    setMarcelMsg(msg); setMarcelMood(mood); setMarcelVis(true);
    marcelTimer.current = setTimeout(() => setMarcelVis(false), ms);
  }

  // ── Socket.io ──────────────────────────────────────────────────────────────
  function connectSocket(rid:string, sid:string, firebaseToken:string) {
    const socket = io(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000', {
      auth: { token: firebaseToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('room:join', { roomId: rid });
    });

    socket.on('game:ball_drawn', ({ ball }: { ball:number }) => {
      play('ball_draw');
      const newDrawn = [...drawnRef.current, ball];
      drawnRef.current = newDrawn;
      setDrawn([...newDrawn]);

      if (sid) {
        const newResult = checkCard(card!, newDrawn);
        resultRef.current = newResult;
        setResult(newResult);
        // Auto-claim
        if (newResult.line  && !claimedRef.current.line)  { claimedRef.current.line=true;  socket.emit('game:claim_line',  { sessionId: sid }); play('line');  showMarcel(pickQuote('tension'), 'happy', 3000); }
        if (newResult.quine && !claimedRef.current.quine) { claimedRef.current.quine=true; socket.emit('game:claim_quine', { sessionId: sid }); play('quine'); showMarcel('✨ QUINE ! Encore un effort !', 'happy', 4000); }
        if (newResult.bingo && !claimedRef.current.bingo) { claimedRef.current.bingo=true; socket.emit('game:claim_bingo', { sessionId: sid }); }
      }
    });

    socket.on('host:speak', ({ text }: { text:string; phraseId:string; audioKey?:string }) => {
      showMarcel(text, 'neutral', 5000);
    });

    socket.on('game:result_update', ({ claimType, couponAwarded: ca }: { claimType:string; valid:boolean; couponAwarded:boolean }) => {
      if (claimType === 'bingo') { play('bingo'); setCouponWon(ca); }
    });

    socket.on('room:player_joined', ({ name }: { name:string }) => {
      setPlayers(prev => prev.some(p => p.name===name) ? prev : [...prev, { name, isGhost:false }]);
    });

    socket.on('game:over', ({ winnerId, couponAwarded: ca }: { winnerId:string; couponAwarded:boolean }) => {
      play('bingo');
      const myUid = user?.uid;
      const isMe  = winnerId === myUid;
      setBingoWinner(isMe ? (user?.displayName ?? 'Vous') : winnerId);
      setCouponWon(isMe && ca);
      clearTimers();
      stopAmbience();
    });
  }

  // ── Matchmaking public ──────────────────────────────────────────────────────
  async function handleJoinPublic() {
    if (!user) return;
    setLoading(true);
    const myName = user.displayName ?? 'Joueur';

    try {
      const firebaseToken = await user.getIdToken();
      // Appel API pour rejoindre une salle publique
      let rid: string;
      let sid: string;
      let serverCard: Card | undefined;
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/join`, {
          method:'POST',
          headers:{'Content-Type':'application/json', Authorization:`Bearer ${firebaseToken}`},
          body:JSON.stringify({ mode:'multiplayer_public' }),
        });
        if (res.ok) {
          const data = await res.json() as { roomId:string; sessionId:string; card?:Card };
          rid = data.roomId; sid = data.sessionId; serverCard = data.card;
        } else { throw new Error(); }
      } catch {
        // Fallback local si API indisponible
        rid = `local_${Date.now()}`; sid = `local_sess_${Date.now()}`;
      }

      const gameCard = serverCard ?? generateCard();
      setCard(gameCard); setRoomId(rid); setSessionId(sid);
      drawnRef.current = []; claimedRef.current = {line:false,quine:false,bingo:false};
      setPlayers([{ name:myName, isGhost:false, isHost:true }]);
      setScreen('waiting_public');
      setCountdown(15);
      setLoading(false);

      // Connexion socket
      connectSocket(rid, sid, firebaseToken);

      // Countdown UI
      let c=15;
      countdownRef.current = setInterval(() => {
        c--; setCountdown(c);
        if (c<=0 && countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current=null; }
      }, 1000);

      // T+10 : remplir fantômes
      fillRef.current = setTimeout(() => {
        setPlayers(prev => {
          const realN = prev.filter(p=>!p.isGhost).length;
          const ghosts = pickGhosts(TOTAL_PLAYERS-realN, myName).map(n=>({name:n,isGhost:true}));
          return [...prev, ...ghosts];
        });
      }, GHOST_FILL_DELAY);

      // T+15 : démarrer partie
      startRef.current = setTimeout(() => {
        setScreen('in_game');
        playAmbience();
        showMarcel(pickQuote('opening'), 'neutral', 5000);
        // Tirage auto si mode local (pas de socket ball_drawn)
        startLocalDraw();
      }, GAME_START_DELAY);

    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  // ── Tirage local (fallback sans socket) ──────────────────────────────────────
  const sequenceRef = useRef<number[]>([]);
  function startLocalDraw() {
    if (socketRef.current?.connected) return; // socket gère le tirage
    const seq = Array.from({length:90},(_,i)=>i+1).sort(()=>Math.random()-0.5);
    sequenceRef.current = seq;
    let drawn = 0;
    setDrawCountdown(AUTO_DRAW_SECS);
    let cd = AUTO_DRAW_SECS;
    drawRef.current = setInterval(() => {
      cd--;
      setDrawCountdown(cd);
      if (cd<=0) {
        cd=AUTO_DRAW_SECS;
        if (drawn>=seq.length || bingoWinner) { clearInterval(drawRef.current!); return; }
        const ball = seq[drawn]!; drawn++;
        play('ball_draw');
        const newDrawn = [...drawnRef.current, ball];
        drawnRef.current = newDrawn;
        setDrawn([...newDrawn]);
        if (card) {
          const nr = checkCard(card, newDrawn);
          resultRef.current = nr; setResult(nr);
          if (nr.line && !claimedRef.current.line)  { claimedRef.current.line=true;  play('line');  showMarcel(pickQuote('tension'), 'happy', 3000); }
          if (nr.quine && !claimedRef.current.quine){ claimedRef.current.quine=true; play('quine'); showMarcel('✨ QUINE !', 'happy', 3500); }
          if (nr.bingo && !claimedRef.current.bingo){ claimedRef.current.bingo=true; play('bingo'); setBingoWinner(user?.displayName??'Vous'); setCouponWon(true); clearInterval(drawRef.current!); stopAmbience(); }
        }
        setDrawCountdown(AUTO_DRAW_SECS);
      }
    }, 1000);
  }

  // ── Salle Famille ─────────────────────────────────────────────────────────────
  async function handleCreateFamily() {
    if (!user) return; setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/create-family`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body:JSON.stringify({}),
      });
      const data = await res.json() as { roomCode?:string; roomId?:string; error?:string };
      if (!res.ok) throw new Error(data.error??'Erreur serveur');
      setRoomCode(data.roomCode??''); setRoomId(data.roomId??null);
      setPlayers([{name:user.displayName??'Vous',isGhost:false,isHost:true}]);
      setScreen('waiting_family');
      if (data.roomId) connectSocket(data.roomId, '', token);
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  async function handleJoinFamily() {
    if (!user||!roomCode.trim()) return; setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/join`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body:JSON.stringify({ mode:'multiplayer_family', roomCode:roomCode.trim().toUpperCase() }),
      });
      const data = await res.json() as { players?:string[]; roomId?:string; error?:string };
      if (!res.ok) throw new Error(data.error??'Salle introuvable');
      setPlayers((data.players??[]).map((n,i)=>({name:n,isGhost:false,isHost:i===0})));
      setRoomId(data.roomId??null); setScreen('waiting_family');
      if (data.roomId) connectSocket(data.roomId,'',token);
    } catch (e: unknown) { Alert.alert('Erreur', e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  function handleLeave() {
    clearTimers(); socketRef.current?.disconnect(); socketRef.current=null;
    setScreen('menu'); setPlayers([]); setRoomCode(''); setCountdown(null);
    setBingoWinner(null); setCouponWon(false); setDrawn([]); setCard(null);
    setResult({line:false,quine:false,bingo:false}); setRoomId(null); setSessionId(null);
    drawnRef.current=[]; claimedRef.current={line:false,quine:false,bingo:false};
    stopAmbience();
  }

  function handleStartFamily() {
    if (!card) setCard(generateCard());
    drawnRef.current=[]; claimedRef.current={line:false,quine:false,bingo:false};
    setDrawn([]); setResult({line:false,quine:false,bingo:false});
    setBingoWinner(null); setCouponWon(false);
    setScreen('in_game');
    playAmbience();
    showMarcel('Bienvenue en Salle Famille ! Marcel est là.', 'neutral', 5000);
    startLocalDraw();
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────────
  if (screen==='menu') return <MenuScreen onJoinPublic={handleJoinPublic} onFamilyJoin={() => setScreen('family_join')} loading={loading}/>;

  if (screen==='family_join') return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => setScreen('menu')} style={st.back}><Ionicons name="close" size={22} color={Colors.parchment}/></TouchableOpacity>
        <Text style={st.headerTitle}>Salle Famille</Text>
      </View>
      <ScrollView contentContainerStyle={{padding:Spacing.lg,gap:16}}>
        <TouchableOpacity style={st.primaryBtn} onPress={handleCreateFamily} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={st.primaryBtnTxt}>Créer une salle</Text>}
        </TouchableOpacity>
        <View style={st.card}>
          <Text style={st.cardTitle}>Rejoindre avec un code</Text>
          <TextInput value={roomCode} onChangeText={t => setRoomCode(t.toUpperCase())}
            placeholder="CODE" style={st.codeInput} maxLength={6} autoCapitalize="characters"/>
          <TouchableOpacity style={[st.primaryBtn,{marginTop:12}]} onPress={handleJoinFamily} disabled={loading||!roomCode.trim()}>
            <Text style={st.primaryBtnTxt}>Rejoindre</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  if (screen==='waiting_public') {
    const total = players.length;
    return (
      <View style={st.container}>
        <View style={st.header}>
          <TouchableOpacity onPress={handleLeave} style={st.back}><Ionicons name="close" size={22} color={Colors.parchment}/></TouchableOpacity>
          <Text style={st.headerTitle}>Recherche de salle…</Text>
        </View>
        <ScrollView contentContainerStyle={{padding:Spacing.lg,gap:16}}>
          <View style={[st.card,{alignItems:'center',gap:10}]}>
            {countdown!==null && countdown>0
              ? <><Text style={st.countBig}>{countdown}</Text><Text style={st.countLabel}>Démarrage dans</Text></>
              : <><ActivityIndicator size="large" color={Colors.orange}/><Text style={st.countLabel}>Marcel prépare la partie…</Text></>}
          </View>
          <View style={st.card}>
            <Text style={st.cardTitle}>Joueurs ({total}/{TOTAL_PLAYERS})</Text>
            {players.map((p,i) => <PlayerRow key={i} player={p}/>)}
            {Array.from({length:TOTAL_PLAYERS-total}).map((_,i)=>
              <View key={`e${i}`} style={[st.playerRow,{opacity:0.3}]}>
                <Ionicons name="ellipse-outline" size={24} color={Colors.textMuted}/>
                <Text style={[st.playerName,{color:Colors.textMuted}]}>En attente…</Text>
              </View>
            )}
          </View>
          <RulesCard/>
        </ScrollView>
      </View>
    );
  }

  if (screen==='waiting_family') return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={handleLeave} style={st.back}><Ionicons name="close" size={22} color={Colors.parchment}/></TouchableOpacity>
        <Text style={st.headerTitle}>Salle Famille</Text>
      </View>
      <ScrollView contentContainerStyle={{padding:Spacing.lg,gap:16}}>
        <View style={st.codeCard}>
          <Text style={st.codeLabel}>Code de la salle</Text>
          <Text style={st.codeDisplay}>{roomCode}</Text>
          <Text style={st.codeHint}>Partagez ce code avec vos proches</Text>
        </View>
        <View style={[st.card,{backgroundColor:'rgba(26,55,108,0.25)'}]}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <Ionicons name="mic-outline" size={22} color={Colors.navy}/>
            <Text style={[st.cardTitle,{color:Colors.navy}]}>Chat vocal (bientôt)</Text>
          </View>
          <Text style={[st.cardDesc,{color:Colors.textMuted,fontSize:13}]}>WebRTC via Agora.io — arrive en Phase 2.</Text>
        </View>
        <View style={st.card}>
          <Text style={st.cardTitle}>Joueurs ({players.length})</Text>
          {players.map((p,i) => <PlayerRow key={i} player={p}/>)}
        </View>
        <TouchableOpacity style={st.primaryBtn} onPress={handleStartFamily}>
          <Text style={st.primaryBtnTxt}>Lancer la partie ({players.length} joueur{players.length>1?'s':''})</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ── IN_GAME ───────────────────────────────────────────────────────────────────
  const lastBall = drawn[drawn.length-1] ?? null;
  return (
    <View style={st.container}>
      {result.bingo && <ConfettiBingo/>}
      <View style={st.header}>
        <Text style={st.headerTitle}>Partie en cours</Text>
        <Text style={st.headerSub}>{players.length} joueurs · {drawn.length} boules tirées</Text>
      </View>
      <ScrollView contentContainerStyle={{paddingBottom:60}}>
        <Marcel visible={marcelVis} mood={marcelMood} message={marcelMsg??''}/>

        {/* Gagnant */}
        {bingoWinner && (
          <View style={st.winCard}>
            <Text style={st.winEmoji}>🎉</Text>
            <Text style={st.winTitle}>BINGO !</Text>
            <Text style={st.winName}>{bingoWinner} remporte {couponWon ? 'le coupon !' : 'la partie !'}</Text>
            {couponWon && <Text style={st.winCoupon}>🎟 Votre coupon est dans l'onglet Coupons</Text>}
            <TouchableOpacity style={[st.primaryBtn,{marginTop:20}]} onPress={handleLeave}>
              <Text style={st.primaryBtnTxt}>Retour au menu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Boule active */}
        {!bingoWinner && lastBall && (
          <View style={st.lastBallSection}>
            <Text style={st.lastBallLabel}>Dernière boule</Text>
            <LotoBall number={lastBall} size={80}/>
            <Text style={st.autoHint}>⏱ Prochain tirage dans {drawCountdown}s</Text>
          </View>
        )}

        {/* Carton */}
        {card && !bingoWinner && <CardGrid card={card} drawn={drawn} result={result}/>}

        {/* Résultats */}
        {!bingoWinner && (
          <View style={st.resultsRow}>
            <ResultChip label="LIGNE"  active={result.line}  color="#43A047"/>
            <ResultChip label="QUINE"  active={result.quine} color="#FB8C00"/>
            <ResultChip label="BINGO"  active={result.bingo} color="#E53935"/>
          </View>
        )}

        {/* Historique boules */}
        {!bingoWinner && drawn.length>0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}} contentContainerStyle={{paddingHorizontal:Spacing.lg,gap:6}}>
            {[...drawn].reverse().map((n,i) => <LotoBall key={i} number={n} size={32}/>)}
          </ScrollView>
        )}

        {/* Joueurs */}
        <View style={[st.card,{marginHorizontal:Spacing.lg}]}>
          <Text style={st.cardTitle}>Joueurs</Text>
          {players.map((p,i) => <PlayerRow key={i} player={p}/>)}
        </View>

        {!bingoWinner && (
          <TouchableOpacity style={[st.secondaryBtn,{margin:Spacing.lg}]} onPress={handleLeave}>
            <Text style={st.secondaryBtnTxt}>Quitter la partie</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function MenuScreen({ onJoinPublic, onFamilyJoin, loading }: { onJoinPublic:()=>void; onFamilyJoin:()=>void; loading:boolean }) {
  return (
    <ScrollView style={st.container} contentContainerStyle={{paddingBottom:60}}>
      <View style={st.header}><Text style={st.headerTitle}>Multijoueur</Text><Text style={st.headerSub}>10 joueurs · Partie garantie en moins de 15 secondes</Text></View>
      <View style={[st.card,{margin:Spacing.lg}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <Ionicons name="globe-outline" size={26} color={Colors.orange}/>
          <Text style={st.cardTitle}>Partie Publique</Text>
        </View>
        <Text style={st.cardDesc}>Jouez avec d'autres joueurs ou des fantômes. Démarrage garanti en moins de 15 secondes.</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8}}>
          <Chip icon="people" label="10 joueurs"/>
          <Chip icon="flash" label="Moins de 15s"/>
          <Chip icon="ticket" label="Coupon au 1er Bingo"/>
        </View>
        <TouchableOpacity style={[st.primaryBtn,loading&&{opacity:0.6},{marginTop:16}]} onPress={onJoinPublic} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={st.primaryBtnTxt}>Trouver une partie</Text>}
        </TouchableOpacity>
      </View>
      <View style={[st.card,{marginHorizontal:Spacing.lg}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <Ionicons name="people-circle-outline" size={26} color={Colors.gold}/>
          <Text style={st.cardTitle}>Salle Famille</Text>
        </View>
        <Text style={st.cardDesc}>Créez une salle privée et invitez vos proches avec un code. Chat vocal bientôt disponible.</Text>
        <TouchableOpacity style={[st.secondaryBtn,{marginTop:16}]} onPress={onFamilyJoin}>
          <Text style={st.secondaryBtnTxt}>Créer / Rejoindre</Text>
        </TouchableOpacity>
      </View>
      <RulesCard/>
    </ScrollView>
  );
}

function RulesCard() {
  return (
    <View style={[st.card,{marginHorizontal:Spacing.lg,backgroundColor:'rgba(200,160,0,0.08)'}]}>
      <Text style={[st.cardTitle,{color:Colors.gold}]}>Règles</Text>
      <Text style={st.ruleText}>🎟 Le coupon va au 1er joueur qui fait Bingo</Text>
      <Text style={st.ruleText}>⭐ Ligne et Quine donnent de l'XP à tous</Text>
      <Text style={st.ruleText}>👻 Les fantômes jouent honnêtement</Text>
    </View>
  );
}

function PlayerRow({ player: p }: { player:Player }) {
  return (
    <View style={st.playerRow}>
      <Ionicons name={p.isGhost?'person-outline':'person-circle'} size={26} color={p.isGhost?Colors.textMuted:Colors.orange}/>
      <Text style={[st.playerName,p.isGhost&&{color:Colors.textMuted}]}>{p.name}</Text>
      {p.isHost  && <View style={st.hostBadge}><Text style={st.hostTxt}>Hôte</Text></View>}
      {p.isGhost && <Text style={st.ghostLbl}>fantôme</Text>}
      <View style={{flexDirection:'row',gap:4}}>
        {p.hasLine  && <StatusBadge label="L" color="#43A047"/>}
        {p.hasQuine && <StatusBadge label="Q" color="#FB8C00"/>}
        {p.hasBingo && <StatusBadge label="B!" color="#E53935"/>}
      </View>
    </View>
  );
}

function StatusBadge({ label, color }: { label:string; color:string }) {
  return <View style={[st.sBadge,{backgroundColor:color}]}><Text style={st.sTxt}>{label}</Text></View>;
}

function ResultChip({ label, active, color }: { label:string; active:boolean; color:string }) {
  return <View style={[st.chip,active&&{backgroundColor:color,borderColor:color}]}><Text style={[st.chipTxt,active&&{color:'#fff'}]}>{label}</Text></View>;
}

function Chip({ icon, label }: { icon:string; label:string }) {
  return <View style={st.miniChip}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={12} color={Colors.orange}/><Text style={st.miniChipTxt}>{label}</Text></View>;
}

const st=StyleSheet.create({
  container:{flex:1,backgroundColor:Colors.background},
  header:{backgroundColor:Colors.wood,paddingTop:52,paddingHorizontal:Spacing.lg,paddingBottom:Spacing.lg,borderBottomWidth:3,borderBottomColor:Colors.woodGrain,gap:4},
  headerTitle:{fontSize:22,fontWeight:'900',color:Colors.parchment},
  headerSub:{fontSize:13,color:Colors.textWood},
  back:{padding:4,marginBottom:4},
  card:{backgroundColor:Colors.surface,borderRadius:Radius.lg,padding:Spacing.lg,gap:10,...Shadow.card},
  cardTitle:{fontSize:17,fontWeight:'800',color:Colors.text},
  cardDesc:{fontSize:14,color:Colors.textMuted,lineHeight:20},
  primaryBtn:{backgroundColor:Colors.orange,borderRadius:Radius.lg,paddingVertical:18,alignItems:'center',...Shadow.card},
  primaryBtnTxt:{fontSize:18,fontWeight:'800',color:'#fff'},
  secondaryBtn:{backgroundColor:Colors.surface,borderRadius:Radius.lg,paddingVertical:16,alignItems:'center',borderWidth:2,borderColor:Colors.woodMid,...Shadow.card},
  secondaryBtnTxt:{fontSize:16,fontWeight:'700',color:Colors.text},
  codeCard:{backgroundColor:Colors.woodMid,borderRadius:Radius.lg,padding:Spacing.xl,alignItems:'center',...Shadow.card},
  codeLabel:{fontSize:13,color:Colors.textWood,fontWeight:'700',letterSpacing:1},
  codeDisplay:{fontSize:48,fontWeight:'900',color:Colors.parchment,letterSpacing:8,marginVertical:8},
  codeHint:{fontSize:13,color:Colors.textMuted},
  codeInput:{borderWidth:2,borderColor:Colors.woodMid,borderRadius:Radius.md,padding:Spacing.md,fontSize:24,fontWeight:'900',textAlign:'center',letterSpacing:6,color:Colors.text,backgroundColor:Colors.surface},
  playerRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:8,borderBottomWidth:1,borderBottomColor:Colors.woodMid},
  playerName:{flex:1,fontSize:15,fontWeight:'700',color:Colors.text},
  hostBadge:{backgroundColor:Colors.orange,borderRadius:Radius.full,paddingHorizontal:8,paddingVertical:3},
  hostTxt:{fontSize:11,fontWeight:'900',color:'#fff'},
  ghostLbl:{fontSize:12,color:Colors.textMuted,fontStyle:'italic'},
  sBadge:{borderRadius:Radius.full,paddingHorizontal:6,paddingVertical:2},
  sTxt:{fontSize:11,fontWeight:'900',color:'#fff'},
  chip:{borderRadius:Radius.full,paddingHorizontal:14,paddingVertical:8,borderWidth:2,borderColor:Colors.woodMid},
  chipTxt:{fontWeight:'900',fontSize:13,color:Colors.textMuted,letterSpacing:1},
  miniChip:{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(240,128,0,0.1)',borderRadius:Radius.full,paddingHorizontal:10,paddingVertical:5},
  miniChipTxt:{fontSize:12,fontWeight:'700',color:Colors.text},
  resultsRow:{flexDirection:'row',justifyContent:'center',gap:12,marginHorizontal:Spacing.lg,marginBottom:12},
  ruleText:{fontSize:14,color:Colors.text,paddingVertical:4},
  countBig:{fontSize:72,fontWeight:'900',color:Colors.orange},
  countLabel:{fontSize:15,color:Colors.textMuted,fontWeight:'700'},
  lastBallSection:{alignItems:'center',paddingVertical:Spacing.lg},
  lastBallLabel:{fontSize:13,color:Colors.textMuted,marginBottom:Spacing.sm,fontWeight:'700',letterSpacing:1},
  autoHint:{fontSize:13,color:Colors.textMuted,marginTop:Spacing.sm},
  winCard:{margin:Spacing.lg,backgroundColor:Colors.surface,borderRadius:Radius.lg,padding:Spacing.xl,alignItems:'center',...Shadow.card,borderWidth:2,borderColor:Colors.gold},
  winEmoji:{fontSize:64,marginBottom:8},
  winTitle:{fontSize:36,fontWeight:'900',color:Colors.orange},
  winName:{fontSize:18,fontWeight:'700',color:Colors.text,textAlign:'center',marginTop:8},
  winCoupon:{fontSize:15,color:Colors.gold,fontWeight:'700',marginTop:8},
});
