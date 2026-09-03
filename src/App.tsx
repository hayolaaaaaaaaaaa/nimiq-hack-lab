import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Award, Bell, ChevronLeft, Clock3, Gamepad2, Grid3X3,
  KeyRound, Lock, Medal, Network, Play, RotateCcw, Shield,
  Sparkles, Trophy, UserRound, Zap
} from "lucide-react";
import { connectNimiq, signScore } from "./nimiq";

type GameId =
  | "block-rush" | "nim-grid" | "nim-pin" | "sequence"
  | "memory" | "nim-lock" | "vault" | "sync" | "node-breach";

type Result = { score: number; xp: number; time?: number };

const games: { id: GameId; name: string; subtitle: string; icon: any; difficulty: string }[] = [
  { id: "block-rush", name: "Block Rush", subtitle: "Clear connected network blocks", icon: Grid3X3, difficulty: "Medium" },
  { id: "nim-grid", name: "NIM Grid", subtitle: "Hit the active nodes", icon: Zap, difficulty: "Easy" },
  { id: "nim-pin", name: "NIM PIN", subtitle: "Crack the generated access code", icon: KeyRound, difficulty: "Easy" },
  { id: "sequence", name: "Key Sequence", subtitle: "Enter the signal in the right order", icon: Activity, difficulty: "Hard" },
  { id: "memory", name: "Address Memory", subtitle: "Remember a fictional address pattern", icon: Shield, difficulty: "Medium" },
  { id: "nim-lock", name: "NIM Lock", subtitle: "Align the rotating lock rings", icon: Lock, difficulty: "Hard" },
  { id: "vault", name: "NIM Vault", subtitle: "Five-ring advanced lock challenge", icon: Trophy, difficulty: "Expert" },
  { id: "sync", name: "Sync", subtitle: "Time the packet inside the target", icon: Network, difficulty: "Medium" },
  { id: "node-breach", name: "Node Breach", subtitle: "Reconstruct the node packet", icon: Network, difficulty: "Hard" }
];

const rand = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - .5);
const today = new Date().toISOString().slice(0, 10);
const dailyThemes = ["Precision Monday", "Signal Tuesday", "Memory Wednesday", "Speed Thursday", "Focus Friday", "Wildcard Saturday", "Reset Sunday"];

function App() {
  const [game, setGame] = useState<GameId | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [xp, setXp] = useState(() => Number(localStorage.getItem("nhl-xp") || 0));
  const [scores, setScores] = useState<Record<string, number>>(() => JSON.parse(localStorage.getItem("nhl-scores") || "{}"));
  const [dailyDone, setDailyDone] = useState(() => localStorage.getItem("nhl-daily") === today);
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("nhl-streak") || 0));
  const [gratitude, setGratitude] = useState(() => localStorage.getItem(`nhl-gratitude-${today}`) || "");
  const [reminders, setReminders] = useState(() => localStorage.getItem("nhl-reminders") === "on");

  useEffect(() => { localStorage.setItem("nhl-xp", String(xp)); }, [xp]);
  useEffect(() => { localStorage.setItem("nhl-scores", JSON.stringify(scores)); }, [scores]);
  useEffect(() => { localStorage.setItem("nhl-streak", String(streak)); }, [streak]);

  const theme = dailyThemes[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  const level = Math.floor(xp / 500) + 1;
  const levelXp = xp % 500;

  async function connect() {
    const a = await connectNimiq();
    if (a) setWallet(a);
  }

  async function finish(id: GameId, result: Result) {
    const best = Math.max(scores[id] || 0, result.score);
    setScores(s => ({ ...s, [id]: best }));
    setXp(x => x + result.xp);
    if (id === "nim-grid" && !dailyDone) {
      setDailyDone(true);
      localStorage.setItem("nhl-daily", today);
      setStreak(value => value + 1);
    }
    if (wallet) await signScore(`NIMIQ-HACK-LAB:${id}:${result.score}:${Date.now()}`);
  }

  function saveGratitude(value: string) {
    setGratitude(value);
    localStorage.setItem(`nhl-gratitude-${today}`, value);
  }

  async function enableReminders() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setReminders(true);
      localStorage.setItem("nhl-reminders", "on");
      if (!dailyDone) new Notification("NIMIQ Hack Lab", { body: "Today's challenge is ready." });
    }
  }

  if (game) {
    return (
      <GameShell title={games.find(g => g.id === game)?.name || "Game"} onBack={() => setGame(null)}>
        <Game id={game} onFinish={(r) => finish(game, r)} />
      </GameShell>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setGame(null)}>
          <div className="brand-mark">N</div>
          <div><b>NIMIQ</b><span>HACK LAB</span></div>
        </div>
        <button className="wallet" onClick={connect}>
          <span className="status-dot" /> {wallet ? `${wallet.slice(0,6)}…${wallet.slice(-4)}` : "Connect NIM"}
        </button>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={14}/> SKILL • SPEED • PRECISION</div>
          <h1>Train like a<br/><em>network operator.</em></h1>
          <p>Fast, replayable challenges built for the Nimiq ecosystem. Play in your browser or inside Nimiq Pay.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setGame("nim-grid")}><Play size={17}/> Play daily challenge</button>
            <button className="ghost" onClick={connect}><Shield size={17}/> {wallet ? "Wallet connected" : "Connect wallet"}</button>
          </div>
        </div>
        <div className="hero-card">
          <div className="radar"><div/><div/><div/><span>⚡</span></div>
          <small>NETWORK STATUS</small><strong>ONLINE</strong>
          <div className="metric"><span>LEVEL {level}</span><span>{xp} XP</span></div>
          <div className="xpbar"><i style={{width: `${levelXp / 5}%`}}/></div>
        </div>
      </section>

      <section className="daily">
        <div className="daily-icon"><Clock3/></div>
        <div><small>{theme.toUpperCase()} • DAILY CHALLENGE</small><b>NIM Grid — one run counts toward today's leaderboard</b></div>
        <span className={dailyDone ? "done" : ""}>{dailyDone ? "COMPLETED" : "READY"}</span>
      </section>

      <section className="return-loop">
        <div className="streak"><strong>{streak}</strong><span>day streak</span><small>{dailyDone ? "Today's run is locked in." : "One run keeps it alive."}</small></div>
        <label className="gratitude"><small>ONE GOOD THING</small><input value={gratitude} onChange={event => saveGratitude(event.target.value)} placeholder="What went well today?" maxLength={90}/></label>
        <button className="reminder" onClick={enableReminders} disabled={reminders}><Bell size={16}/>{reminders ? "Return nudge on" : "Nudge me next visit"}</button>
      </section>

      <section className="section-head"><div><small>THE LAB</small><h2>Choose a challenge</h2></div><div className="level-pill"><Award size={15}/> Level {level}</div></section>
      <section className="grid">
        {games.map(g => {
          const Icon = g.icon;
          return <button className="game-card" key={g.id} onClick={() => setGame(g.id)}>
            <div className="game-icon"><Icon size={23}/></div>
            <div className="game-copy"><b>{g.name}</b><span>{g.subtitle}</span></div>
            <div className="card-meta"><span>{g.difficulty}</span>{scores[g.id] ? <strong>BEST {scores[g.id]}</strong> : <strong>NEW</strong>}</div>
          </button>
        })}
      </section>

      <section className="stats">
        <div><Medal/><small>BEST SCORE</small><b>{Math.max(0, ...Object.values(scores))}</b></div>
        <div><Gamepad2/><small>GAMES PLAYED</small><b>{Object.keys(scores).length}</b></div>
        <div><Trophy/><small>RANK</small><b>—</b></div>
        <div><UserRound/><small>PLAYER</small><b>{wallet ? "NIM" : "GUEST"}</b></div>
      </section>
      <footer>Built for Nimiq Pay • No private keys are ever exposed to the app.</footer>
    </main>
  );
}

function GameShell({title, onBack, children}:{title:string;onBack:()=>void;children:any}) {
  return <main className="game-shell">
    <header className="topbar"><button className="back" onClick={onBack}><ChevronLeft/> Games</button><div className="brand mini"><div className="brand-mark">N</div><div><b>NIMIQ</b><span>HACK LAB</span></div></div><div className="game-title">{title}</div></header>
    <section className="game-stage">{children}</section>
  </main>
}

function Game({id,onFinish}:{id:GameId;onFinish:(r:Result)=>void}) {
  switch(id) {
    case "block-rush": return <BlockRush onFinish={onFinish}/>;
    case "nim-grid": return <NimGrid onFinish={onFinish}/>;
    case "nim-pin": return <NimPin onFinish={onFinish}/>;
    case "sequence": return <Sequence onFinish={onFinish}/>;
    case "memory": return <Memory onFinish={onFinish}/>;
    case "nim-lock": return <RotatingLock count={4} limit={20000} title="NIM LOCK" onFinish={onFinish}/>;
    case "vault": return <RotatingLock count={5} limit={10000} title="NIM VAULT" onFinish={onFinish}/>;
    case "sync": return <Sync onFinish={onFinish}/>;
    case "node-breach": return <NodeBreach onFinish={onFinish}/>;
  }
}

function ResultBox({result,onRestart}:{result:Result;onRestart:()=>void}) {
  return <div className="result"><div className="result-icon"><Trophy/></div><small>CHALLENGE COMPLETE</small><h2>{result.score.toLocaleString()}</h2><p>+{result.xp} XP</p><button className="primary" onClick={onRestart}><RotateCcw size={16}/> Run again</button></div>
}

function BlockRush({onFinish}:{onFinish:(r:Result)=>void}) {
  const colors = ["cyan","lime","violet"];
  const [board,setBoard]=useState(()=>Array.from({length:88},()=>colors[rand(3)]));
  const [score,setScore]=useState(0); const [time,setTime]=useState(30); const [done,setDone]=useState(false);
  useEffect(()=>{ if(done)return; const t=setInterval(()=>setTime(x=>{if(x<=1){clearInterval(t);setDone(true);return 0}return x-1}),1000); return()=>clearInterval(t)},[done]);
  function click(i:number){
    if(done)return; const col=board[i]; const seen=new Set<number>(), q=[i];
    while(q.length){const x=q.pop()!; if(seen.has(x)||board[x]!==col)continue; seen.add(x); const r=Math.floor(x/11),c=x%11; [x-11,x+11,x-1,x+1].forEach(n=>{if(n>=0&&n<88&&Math.floor(n/11)>=r-1&&Math.floor(n/11)<=r+1&&Math.abs((n%11)-c)<=1)q.push(n)})}
    if(seen.size<3)return;
    const a=board.map((v,j)=>seen.has(j) ? null : v).filter(Boolean) as string[];
    const next=[...Array(88-a.length).fill(null),...a];
    setBoard(next); setScore(s=>s+seen.size*seen.size*10);
    if(!a.length){setDone(true);onFinish({score:score+seen.size*seen.size*10,xp:150,time:30-time})}
  }
  if(done)return <ResultBox result={{score,xp:150}} onRestart={()=>{setBoard(Array.from({length:88},()=>colors[rand(3)]));setScore(0);setTime(30);setDone(false)}}/>;
  return <div className="challenge"><GameHUD label="BLOCK RUSH" value={String(score)} timer={`${time}s`}/><div className="block-board">{board.map((c,i)=><button key={i} className={`block ${c||"empty"}`} onClick={()=>click(i)}/>)}</div><p className="hint">Clear groups of 3+ matching nodes. Bigger groups = bigger score.</p></div>
}

function NimGrid({onFinish}:{onFinish:(r:Result)=>void}) {
  const [active,setActive]=useState(rand(16)); const [hits,setHits]=useState(0); const [time,setTime]=useState(15); const [done,setDone]=useState(false);
  useEffect(()=>{if(done)return;const t=setInterval(()=>setTime(x=>{if(x<=.1){setDone(true);onFinish({score:hits*100,xp:100,time:15});return 0}return x-.1}),100);return()=>clearInterval(t)},[done,hits,onFinish]);
  if(done)return <ResultBox result={{score:hits*100,xp:100}} onRestart={()=>{setHits(0);setTime(15);setActive(rand(16));setDone(false)}}/>;
  return <div className="challenge"><GameHUD label="NIM GRID" value={`${hits} HITS`} timer={`${time.toFixed(1)}s`}/><div className="nim-grid">{Array.from({length:16},(_,i)=><button key={i} className={i===active?"node active":"node"} onClick={()=>{if(i===active){setHits(h=>h+1);setActive(rand(16))}}}><span/></button>)}</div><p className="hint">Hit the glowing node. Every correct hit moves it.</p></div>
}

function NimPin({onFinish}:{onFinish:(r:Result)=>void}) {
  const [pin,setPin]=useState(()=>String(rand(9000)+1000)); const [input,setInput]=useState(""); const [time,setTime]=useState(12); const [done,setDone]=useState(false);
  useEffect(()=>{if(done)return;const t=setInterval(()=>setTime(x=>{if(x<=.1){setDone(true);return 0}return x-.1}),100);return()=>clearInterval(t)},[done]);
  function key(k:string){if(done)return; const n=input+k;if(n.length<=4)setInput(n); if(n===pin){const score=Math.max(100,Math.round(time*100));setDone(true);onFinish({score,xp:125,time:12-time})}}
  if(done)return <ResultBox result={{score:input===pin?Math.max(100,Math.round(time*100)):0,xp:input===pin?125:25}} onRestart={()=>{setPin(String(rand(9000)+1000));setInput("");setTime(12);setDone(false)}}/>;
  return <div className="challenge narrow"><GameHUD label="NIM PIN" value="4 DIGITS" timer={`${time.toFixed(1)}s`}/><div className="pin-display">{input.padEnd(4,"•")}</div><div className="keypad">{["1","2","3","4","5","6","7","8","9","0"].map(k=><button key={k} onClick={()=>key(k)}>{k}</button>)}</div><p className="hint">Generated challenge. No real wallet PIN is requested.</p></div>
}

function Sequence({onFinish}:{onFinish:(r:Result)=>void}) {
  const chars="QWERASD"; const [seq]=useState(()=>Array.from({length:12},()=>chars[rand(chars.length)])); const [input,setInput]=useState(""); const [time,setTime]=useState(7); const [done,setDone]=useState(false);
  useEffect(()=>{if(done)return;const t=setInterval(()=>setTime(x=>{if(x<=.1){setDone(true);return 0}return x-.1}),100);return()=>clearInterval(t)},[done]);
  function press(c:string){if(done)return;const next=input+c; if(seq.slice(0,next.length).join("")!==next){setDone(true);onFinish({score:0,xp:15});return}setInput(next);if(next===seq.join("")){const score=Math.round(time*1000);setDone(true);onFinish({score,xp:180,time:7-time})}}
  if(done)return <ResultBox result={{score:input===seq.join("")?Math.round(time*1000):0,xp:input===seq.join("")?180:15}} onRestart={()=>location.reload()}/>;
  return <div className="challenge"><GameHUD label="KEY SEQUENCE" value={`${input.length}/${seq.length}`} timer={`${time.toFixed(2)}s`}/><div className="sequence">{seq.map((c,i)=><span className={i<input.length?"seen":""} key={i}>{c}</span>)}</div><div className="key-row">{chars.split("").map(c=><button key={c} onClick={()=>press(c)}>{c}</button>)}</div></div>
}

function Memory({onFinish}:{onFinish:(r:Result)=>void}) {
  const [code]=useState(()=>Array.from({length:6},()=>["NQ","7F","3A","C2","91","D8"][rand(6)])); const [show,setShow]=useState(true); const [input,setInput]=useState<string[]>([]); const [done,setDone]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setShow(false),2500);return()=>clearTimeout(t)},[]);
  const options=useMemo(()=>shuffle([...code,...Array.from({length:6},()=>["AA","1B","EF","42","09","BC"][rand(6)])]),[code]);
  function pick(x:string){if(done)return;const next=[...input,x];setInput(next);if(next.length===code.length){const ok=next.every((v,i)=>v===code[i]);setDone(true);onFinish({score:ok?600:0,xp:ok?160:20})}}
  if(done)return <ResultBox result={{score:input.every((v,i)=>v===code[i])?600:0,xp:input.every((v,i)=>v===code[i])?160:20}} onRestart={()=>location.reload()}/>;
  return <div className="challenge narrow"><GameHUD label="ADDRESS MEMORY" value={show?"MEMORIZE":"REBUILD"} timer={show?"2.5s":"∞"}/><div className="memory-code">{show?code.map(x=><b key={x}>{x}</b>):input.map(x=><b key={Math.random()}>{x}</b>)}</div>{!show&&<div className="memory-options">{options.map((x,i)=><button key={i} onClick={()=>pick(x)}>{x}</button>)}</div>}</div>
}

function RotatingLock({count,limit,title,onFinish}:{count:number;limit:number;title:string;onFinish:(r:Result)=>void}) {
  const [angles,setAngles]=useState(()=>Array.from({length:count},()=>rand(8)*45)); const [target]=useState(()=>Array.from({length:count},()=>rand(8)*45)); const [start]=useState(Date.now()); const [done,setDone]=useState(false);
  useEffect(()=>{const t=setInterval(()=>{if(Date.now()-start>=limit&&!done){setDone(true);onFinish({score:0,xp:20})}},100);return()=>clearInterval(t)},[done,start,limit,onFinish]);
  const solved=angles.every((a,i)=>Math.abs(((a-target[i]+540)%360)-180)<12);
  useEffect(()=>{if(solved&&!done){setDone(true);const left=Math.max(0,limit-(Date.now()-start));onFinish({score:Math.round(left/5)+count*100,xp:count===5?220:180,time:Date.now()-start})}},[solved,done,count,limit,onFinish,start]);
  if(done)return <ResultBox result={{score:solved?count*200:0,xp:solved?(count===5?220:180):20}} onRestart={()=>location.reload()}/>;
  return <div className="challenge"><GameHUD label={title} value={`${count} LOCKS`} timer={`${Math.max(0,((limit-(Date.now()-start))/1000)).toFixed(1)}s`}/><div className="locks">{angles.map((a,i)=><button key={i} className="lock-ring" style={{transform:`rotate(${a}deg)`}} onClick={()=>setAngles(v=>v.map((x,j)=>j===i?x+45:x))}><i/><span style={{transform:`rotate(${-a}deg)`}}>●</span><em style={{transform:`rotate(${-a}deg)`}}>▲</em></button>)}</div><p className="hint">Rotate each ring until its dot aligns with the target marker.</p></div>
}

function Sync({onFinish}:{onFinish:(r:Result)=>void}) {
  const [pos,setPos]=useState(0); const [dir,setDir]=useState(1); const [tries,setTries]=useState(3); const [done,setDone]=useState(false); const [score,setScore]=useState(0);
  useEffect(()=>{if(done)return;const t=setInterval(()=>setPos(p=>{let n=p+dir*2;if(n>=100){setDir(-1);n=100}if(n<=0){setDir(1);n=0}return n}),30);return()=>clearInterval(t)},[dir,done]);
  function hit(){if(pos>42&&pos<58){const s=score+100;setScore(s);if(s>=500){setDone(true);onFinish({score:s,xp:150})}}else{const t=tries-1;setTries(t);if(t<=0){setDone(true);onFinish({score,xp:20})}}}
  if(done)return <ResultBox result={{score,xp:score>=500?150:20}} onRestart={()=>location.reload()}/>;
  return <div className="challenge"><GameHUD label="SYNC" value={`${score} PTS`} timer={`${tries} attempts`}/><div className="sync-track"><div className="sync-target"/><div className="sync-cursor" style={{left:`${pos}%`}}/></div><button className="primary huge" onClick={hit}>SYNC PACKET</button></div>
}

function NodeBreach({onFinish}:{onFinish:(r:Result)=>void}) {
  const chars="0123456789ABCDEF"; const [seq]=useState(()=>Array.from({length:6},()=>chars[rand(16)])); const [input,setInput]=useState(""); const [time,setTime]=useState(9); const [done,setDone]=useState(false);
  useEffect(()=>{if(done)return;const t=setInterval(()=>setTime(x=>{if(x<=.1){setDone(true);onFinish({score:0,xp:10});return 0}return x-.1}),100);return()=>clearInterval(t)},[done,onFinish]);
  function p(c:string){const n=input+c;if(seq.slice(0,n.length).join("")!==n){setDone(true);onFinish({score:0,xp:10});return}setInput(n);if(n===seq.join("")){setDone(true);onFinish({score:Math.round(time*100),xp:200})}}
  if(done)return <ResultBox result={{score:input===seq.join("")?Math.round(time*100):0,xp:input===seq.join("")?200:10}} onRestart={()=>location.reload()}/>;
  return <div className="challenge"><GameHUD label="NODE BREACH" value={`${input.length}/6`} timer={`${time.toFixed(1)}s`}/><div className="node-code">{seq.map((x,i)=><span key={i}>{i<input.length?x:"•"}</span>)}</div><div className="hexpad">{chars.split("").map(c=><button key={c} onClick={()=>p(c)}>{c}</button>)}</div></div>
}

function GameHUD({label,value,timer}:{label:string;value:string;timer:string}) {
  return <div className="hud"><div><small>{label}</small><b>{value}</b></div><div className="timer"><Clock3 size={17}/>{timer}</div></div>
}

export default App;
