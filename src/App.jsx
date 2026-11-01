import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Check,
  ChevronDown, CircleHelp, CreditCard, DollarSign, LayoutDashboard, LogOut,
  Menu, Plus, Search, Settings, ShieldCheck, ShoppingBag, TrendingUp, Wallet, Target, CalendarClock, FileDown,
  X, Trash2, PiggyBank, Sun, Moon, BookOpen, ChevronLeft, ChevronRight, PlayCircle, Eye, EyeOff, KeyRound
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  XAxis, YAxis, PieChart, Pie, Cell
} from "recharts";
import Modal from "./components/Modal";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { store } from "./lib/storage";
import { money, dateLabel, summarize, today } from "./lib/finance";

const nav = [
  ["dashboard", "Visão geral", LayoutDashboard],
  ["transactions", "Movimentações", Activity],
  ["purchases", "Minhas compras", ShoppingBag],
  ["reserve", "Minha reserva", PiggyBank],
  ["reports", "Relatórios", BarChart3],
  ["planning", "Planejamento", Target]
];

const categories = ["Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Compras", "Salário", "Freelance", "Outros"];

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ transactions: [], purchases: [], reserveMoves: [], goals: [], budgets: [], recurring: [] });
  const [modal, setModal] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [tutorialStep, setTutorialStep] = useState(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const totals = useMemo(() => summarize(data.transactions, data.purchases, data.reserveMoves), [data]);
  const isCloud = hasSupabaseConfig;

  useEffect(() => {
    if (!isCloud) {
      const demoUser = { id: "local-demo", email: "demo@valtrix.local", user_metadata: { full_name: "Visitante" } };
      setUser(demoUser);
      loadData(demoUser.id);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user || null);
      if (session?.user) loadData(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(session); setUser(session?.user || null);
      if (session?.user) loadData(session.user.id);
      else setData({ transactions: [], purchases: [], reserveMoves: [], goals: [], budgets: [], recurring: [] });
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Exibe o guia uma única vez por conta. O progresso fica salvo neste navegador.
  useEffect(() => {
    if (!user?.id) return;
    const completed = window.localStorage.getItem(`valtrix:tutorial:v4:${user.id}`);
    if (!completed) setTutorialStep(0);
  }, [user?.id]);

  const tutorial = [
    { page: "dashboard", title: "Conheça sua visão geral", description: "O Dashboard reúne os números mais importantes: saldo disponível, entradas do mês, despesas e reserva financeira. O gráfico ajuda a comparar o dinheiro que entrou e saiu nos últimos meses.", tip: "Comece conferindo seus cartões de resumo. Eles mudam conforme você registra movimentações." },
    { page: "transactions", title: "Registre entradas e despesas", description: "Em Movimentações você acompanha os valores recebidos e os gastos do dia a dia. Use o botão de nova movimentação para cadastrar salário, pagamentos, contas e outras despesas.", tip: "Informe descrição, valor, data e categoria para manter seu histórico organizado." },
    { page: "purchases", title: "Organize suas compras", description: "Em Minhas compras você registra produtos ou serviços adquiridos. Escolha se o pagamento saiu do saldo disponível ou da reserva financeira.", tip: "O Valtrix desconta o valor da origem escolhida e considera a compra nos totais." },
    { page: "reserve", title: "Cuide da sua reserva", description: "A área Minha reserva mostra quanto você guardou. Registre depósitos quando separar dinheiro e retiradas quando precisar usar parte desse valor.", tip: "Acompanhe o total reservado e mantenha seus objetivos financeiros em dia." },
    { page: "reports", title: "Entenda seus relatórios", description: "Os Relatórios mostram o total de entradas, despesas, compras e reserva. O gráfico por categoria ajuda a identificar onde estão concentrados seus gastos.", tip: "Quanto mais completos forem seus registros, mais úteis serão as análises." },
    { page: "planning", title: "Planeje suas finanças", description: "Em Planejamento você organiza metas financeiras, define quanto pretende guardar e acompanha o progresso. Também pode configurar orçamentos por categoria e acompanhar despesas recorrentes e seus vencimentos.", tip: "Atualize seus valores conforme sua realidade. Orçamentos e metas ajudam no acompanhamento, mas não movimentam seu saldo automaticamente." },
    { page: "settings", title: "Alterar senha manualmente", description: "Em Configurações, localize Alterar senha manualmente. Informe sua senha atual e depois escolha uma nova senha com pelo menos 6 caracteres. A nova senha precisa ser diferente da atual.", tip: "Essa opção exige que você esteja conectado à conta e saiba a senha atual. Use os ícones de olho para conferir o que digitou antes de salvar." },
    { page: "settings", title: "Criar ou atualizar o código de recuperação", description: "Na seção Código de recuperação de senha, crie um código pessoal com exatamente 6 números e salve. Se já tiver um código, você pode cadastrar outro para substituí-lo. O código não poderá ser visualizado novamente depois de salvo.", tip: "Guarde o código em um local seguro, fora do Valtrix. Não compartilhe com ninguém. A configuração exige uma conta conectada ao Supabase." },
    { page: "settings", title: "Recuperar acesso e cadastrar uma senha nova", description: "Se esquecer sua senha, na tela de login escolha Esqueci minha senha. Informe o e-mail da conta, o código de recuperação de 6 números e uma nova senha. Depois de concluir, entre usando a nova senha.", tip: "A recuperação depende de o código ter sido configurado anteriormente e da Edge Function password-recovery-code estar publicada e configurada no Supabase. Se ainda não salvou seu código, faça isso enquanto estiver conectado." },
    { page: "settings", title: "Configurações e ajuda", description: "Em Configurações você confere sua conta, altera a senha, gerencia seu código de recuperação e pode rever este guia sempre que precisar.", tip: "Este tutorial reúne as áreas principais e as novidades da V5.4. Você pode reabri-lo pelo botão Rever tutorial." }
  ];

  function finishTutorial() {
    if (user?.id) window.localStorage.setItem(`valtrix:tutorial:v4:${user.id}`, "completed");
    setTutorialStep(null);
  }
  function startTutorial() { setPage("dashboard"); setTutorialStep(0); setMobileNav(false); }
  function nextTutorialStep() {
    if (tutorialStep >= tutorial.length - 1) { finishTutorial(); return; }
    const next = tutorialStep + 1;
    setTutorialStep(next);
    setPage(tutorial[next].page);
  }
  function previousTutorialStep() {
    const previous = Math.max(0, tutorialStep - 1);
    setTutorialStep(previous);
    setPage(tutorial[previous].page);
  }

  async function loadData(userId) {
    try { setData(await store.getAll(userId)); }
    catch (e) { notify("Não foi possível carregar seus dados: " + e.message); }
  }
  function notify(message) { setToast(message); window.setTimeout(() => setToast(""), 3200); }

  async function authenticate(e) {
    e.preventDefault(); setAuthError(""); setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email"); const password = form.get("password");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: form.get("name") }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        // O Supabase pode ocultar a existência de e-mails por segurança. Quando
        // retorna identities vazio, conseguimos sinalizar o cadastro já existente.
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setAuthError("Este e-mail já possui uma conta. Faça login ou use outro endereço.");
          return;
        }
        setAuthError("Cadastro enviado. Confira seu e-mail para confirmar a conta, se a confirmação estiver ativa.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const message = String(err?.message || "");
      if (/already registered|user already exists|email.*already/i.test(message)) {
        setAuthError("Este e-mail já está cadastrado. Faça login ou recupere sua senha.");
      } else if (/invalid login credentials/i.test(message)) {
        setAuthError("E-mail ou senha incorretos. Confira os dados e tente novamente.");
      } else if (/rate.?limit|too many requests|email.*limit|429/i.test(message)) {
        // Não exibe mensagens técnicas de limite do provedor de e-mail ao usuário.
        setAuthError("Não foi possível concluir agora. Aguarde um pouco e tente novamente.");
      } else {
        setAuthError(message || "Não foi possível concluir. Tente novamente.");
      }
    }
    finally { setBusy(false); }
  }

  async function saveItem(kind, item) {
    setBusy(true);
    try {
      // Evita registrar saídas maiores que o saldo disponível na origem escolhida.
      if (kind === "purchase" && item.payment_source === "reserve" && item.amount > totals.reserve) {
        throw new Error("O valor da compra é maior que sua reserva disponível.");
      }
      if (kind === "purchase" && item.payment_source === "balance" && item.amount > totals.balance) {
        throw new Error("O valor da compra é maior que seu saldo disponível.");
      }
      if (kind === "reserve" && item.type === "withdrawal" && item.amount > totals.reserve) {
        throw new Error("O valor da retirada é maior que sua reserva disponível.");
      }
      if (kind === "transaction" && item.type === "expense" && item.amount > totals.balance) {
        throw new Error("Essa despesa é maior que seu saldo disponível.");
      }
      if (kind === "transaction") await store.addTransaction(user.id, item);
      if (kind === "purchase") await store.addPurchase(user.id, item);
      if (kind === "reserve") await store.addReserveMove(user.id, item);
      await loadData(user.id); setModal(null); notify("Registro salvo com sucesso.");
    } catch (e) { notify("Erro ao salvar: " + e.message); }
    finally { setBusy(false); }
  }

  async function removeItem(kind, itemId) {
    if (!window.confirm("Tem certeza que deseja excluir este registro? O saldo será recalculado.")) return;
    try {
      if (kind === "transaction") await store.deleteTransaction(itemId, user.id);
      if (kind === "purchase") await store.deletePurchase(itemId, user.id);
      if (kind === "reserve") await store.deleteReserveMove(itemId, user.id);
      await loadData(user.id); notify("Registro excluído e saldo atualizado.");
    } catch (e) { notify("Erro ao excluir: " + e.message); }
  }

  async function saveFeature(kind, item) {
    setBusy(true);
    try { await store.addFeature(kind, item, user.id); await loadData(user.id); notify("Planejamento salvo com sucesso."); }
    catch (e) { notify("Erro ao salvar: " + e.message); }
    finally { setBusy(false); }
  }
  async function deleteFeature(kind, id) {
    if (!window.confirm("Deseja excluir este item?")) return;
    try { await store.deleteFeature(kind, id, user.id); await loadData(user.id); notify("Item excluído."); }
    catch (e) { notify("Erro ao excluir: " + e.message); }
  }
  async function updateFeature(kind, id, patch) {
    try { await store.updateFeature(kind, id, patch, user.id); await loadData(user.id); notify("Progresso atualizado."); }
    catch (e) { notify("Erro ao atualizar: " + e.message); }
  }

  async function signOut() {
    if (isCloud) await supabase.auth.signOut();
    setUser(null); setData({ transactions: [], purchases: [], reserveMoves: [], goals: [], budgets: [], recurring: [] });
  }

  if (!user || passwordRecovery) return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={authenticate} error={authError} busy={busy} recovery={passwordRecovery}/>;

  return <div className={dark ? "app dark" : "app light"}>
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={21}/></div><span>valtrix</span><button className="mobile-close icon-btn" onClick={() => setMobileNav(false)}><X/></button></div>
      <div className="workspace-label">MENU PRINCIPAL</div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} className={`nav-link ${page === id ? "active" : ""}`} onClick={() => { setPage(id); setMobileNav(false); }}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="secure-note"><ShieldCheck size={17}/><div><strong>Seus dados protegidos</strong><small>{isCloud ? "Conexão Supabase" : "Modo local de demonstração"}</small></div></div>
        <button className="nav-link" onClick={() => setPage("settings")}><Settings size={18}/>Configurações</button>
        <button className="nav-link" onClick={signOut}><LogOut size={18}/>Sair da conta</button>
      </div>
      <div className="sidebar-foot">VALTRIX • CONTROLE FINANCEIRO</div>
    </aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu/></button>
        <div className="breadcrumb">Workspace <span>/</span> <strong>{nav.find(x => x[0] === page)?.[1] || "Configurações"}</strong></div>
        <div className="top-actions"><button className="icon-btn" onClick={() => setDark(!dark)} title="Alternar tema">{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="avatar">{(user.user_metadata?.full_name || user.email || "F").slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user.user_metadata?.full_name || "Minha conta"}</strong><small>{user.email}</small></div><ChevronDown size={15} className="muted"/></div>
      </header>
      <div className="content">
        {page === "dashboard" && <Dashboard data={data} totals={totals} onAdd={setModal} />}
        {page === "transactions" && <Transactions data={data} search={search} setSearch={setSearch} onAdd={setModal} onDelete={removeItem}/>}
        {page === "purchases" && <Purchases data={data} search={search} setSearch={setSearch} onAdd={setModal} onDelete={removeItem}/>}
        {page === "reserve" && <Reserve data={data} totals={totals} onAdd={setModal} onDelete={removeItem}/>}
        {page === "reports" && <Reports data={data} totals={totals}/> }
        {page === "planning" && <Planning data={data} onSave={saveFeature} onDelete={deleteFeature} onUpdate={updateFeature} busy={busy}/> }
        {page === "settings" && <SettingsPage isCloud={isCloud} user={user} onRestartTutorial={startTutorial}/>}
      </div>
      <footer className="footer">Valtrix <span>•</span> Feito para organizar sua vida financeira.</footer>
    </main>
    {modal && <EntryModal type={modal} onClose={() => setModal(null)} onSave={saveItem} busy={busy}/>}
    {tutorialStep !== null && <TutorialModal step={tutorial[tutorialStep]} current={tutorialStep + 1} total={tutorial.length} onNext={nextTutorialStep} onPrevious={previousTutorialStep} onSkip={finishTutorial}/>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}

function AuthScreen({ mode, setMode, onSubmit, error, busy, recovery = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [showCodeRecovery, setShowCodeRecovery] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const isPasswordRecovery = recovery || new URLSearchParams(window.location.search).get("type") === "recovery" || window.location.hash.includes("type=recovery");
  async function recoverWithCode(e) {
    e.preventDefault(); setRecoveryMessage(""); setRecovering(true);
    const form = new FormData(e.currentTarget);
    try {
      const { data, error } = await supabase.functions.invoke("password-recovery-code", { body: { action: "recover", email: String(form.get("email")||"").trim().toLowerCase(), code: String(form.get("code")||"").trim(), newPassword: String(form.get("newPassword")||"") } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Não foi possível recuperar a senha.");
      setRecoveryMessage("Senha alterada! Agora você já pode entrar com a nova senha.");
      setShowCodeRecovery(false);
    } catch (err) { setRecoveryMessage(err.message || "Não foi possível recuperar a senha."); }
    finally { setRecovering(false); }
  }
  async function updateRecoveredPassword(e) {
    e.preventDefault(); const form=new FormData(e.currentTarget); const password=String(form.get("newPassword")||"");
    if(password.length<6){setRecoveryMessage("A nova senha precisa ter pelo menos 6 caracteres.");return;}
    const {error}=await supabase.auth.updateUser({password});
    setRecoveryMessage(error?error.message:"Senha atualizada. Você já pode continuar usando o Valtrix.");
    if(!error) { window.history.replaceState({},"",window.location.pathname); window.location.reload(); }
  }
  if (!hasSupabaseConfig) return <div className="auth-page"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark"><Wallet/></div><span>valtrix</span></div><div className="auth-icon"><Wallet size={25}/></div><h1>Seu dinheiro, sob controle.</h1><p>Organize entradas, despesas, compras e sua reserva em um só lugar.</p><div className="demo-banner"><ShieldCheck size={18}/><div><strong>Modo local ativado</strong><small>Seus registros ficam salvos neste navegador. Configure o Supabase quando quiser habilitar contas reais.</small></div></div><button className="primary-btn full" onClick={() => window.location.reload()}>Entrar no painel <ArrowUpRight size={17}/></button><small className="auth-foot">Projeto de estudos • Valtrix</small></div></div>;
  if(showCodeRecovery) return <div className="auth-page"><form className="auth-card" onSubmit={recoverWithCode}><div className="brand auth-brand"><div className="brand-mark"><Wallet/></div><span>valtrix</span></div><h1>Recuperar senha</h1><p>Informe seu e-mail, o código de recuperação e escolha uma nova senha.</p><label>E-mail da conta<input name="email" type="email" required placeholder="voce@email.com"/></label><label>Código de recuperação<input name="code" inputMode="numeric" pattern="[0-9]{6}" minLength="6" maxLength="6" required placeholder="6 dígitos"/></label><label>Nova senha<input name="newPassword" type="password" minLength="6" required placeholder="Mínimo de 6 caracteres"/></label>{recoveryMessage&&<div className="form-message" role="status">{recoveryMessage}</div>}<button className="primary-btn full" disabled={recovering}>{recovering ? "Recuperando..." : "Redefinir senha"}</button><button type="button" className="text-btn" onClick={()=>{setShowCodeRecovery(false);setRecoveryMessage("");}}>Voltar para entrar</button></form></div>;
  if(isPasswordRecovery) return <div className="auth-page"><form className="auth-card" onSubmit={updateRecoveredPassword}><div className="brand auth-brand"><div className="brand-mark"><Wallet/></div><span>valtrix</span></div><h1>Crie uma nova senha</h1><p>Escolha uma senha segura para sua conta.</p><label>Nova senha<input name="newPassword" type="password" minLength="6" required placeholder="Mínimo de 6 caracteres"/></label>{recoveryMessage&&<div className="form-message" role="status">{recoveryMessage}</div>}<button className="primary-btn full">Atualizar senha</button></form></div>;
  return <div className="auth-page"><form className="auth-card" onSubmit={onSubmit}><div className="brand auth-brand"><div className="brand-mark"><Wallet/></div><span>valtrix</span></div><h1>{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1><p>Acesse seu espaço de organização financeira.</p>{mode === "signup" && <label>Nome completo<input name="name" required placeholder="Como podemos te chamar?"/></label>}<label>E-mail<input name="email" type="email" required placeholder="voce@email.com"/></label><label>Senha<div className="password-field"><input name="password" type={showPassword ? "text" : "password"} minLength="6" required placeholder="Mínimo de 6 caracteres"/><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} title={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>{error && <div className="form-message" role="alert">{error}</div>}<button className="primary-btn full" disabled={busy}>{busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>{mode === "login" && <button type="button" className="text-btn" onClick={()=>{setShowCodeRecovery(v=>!v);setRecoveryMessage("");}}>{showCodeRecovery ? "Voltar para entrar" : "Esqueci minha senha"}</button>}{recoveryMessage && <div className="form-message" role="status" style={{color:"#a5b9c8"}}>{recoveryMessage}</div>}<button type="button" className="text-btn" onClick={() => { setShowPassword(false); setRecoveryMessage(""); setMode(mode === "login" ? "signup" : "login"); }}>{mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entre"}</button></form></div>;
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function StatCard({ label, value, icon: Icon, tone, note, format = "currency" }) {
  const displayValue = format === "number" ? new Intl.NumberFormat("pt-BR").format(Number(value) || 0) : money(value);
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div className="stat-label">{label}</div><div className="stat-value">{displayValue}</div><div className="stat-note">{note}</div></div>;
}
function PrimaryButton({ children, onClick }) { return <button className="primary-btn" onClick={onClick}><Plus size={17}/>{children}</button>; }

function Dashboard({ data, totals, onAdd }) {
  const month = today().slice(0,7);
  const txMonth = data.transactions.filter(x => String(x.occurred_at).slice(0,7) === month);
  const inc = txMonth.filter(x => x.type === "income").reduce((s,x) => s + Number(x.amount),0);
  const exp = txMonth.filter(x => x.type === "expense").reduce((s,x) => s + Number(x.amount),0);
  const chart = Array.from({length: 6}, (_,i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5-i));
    const key = d.toISOString().slice(0,7);
    const sum = type => data.transactions.filter(x => String(x.occurred_at).slice(0,7) === key && x.type === type).reduce((s,x)=>s+Number(x.amount),0);
    return { month: d.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""), entradas: sum("income"), despesas: sum("expense") };
  });
  const recent = [...data.transactions.map(x=>({...x, kind:"transaction"})), ...data.purchases.map(x=>({...x, kind:"purchase", title:x.name, type:"purchase"}))].sort((a,b)=>new Date(b.occurred_at)-new Date(a.occurred_at)).slice(0,5);
  return <>
    <PageHeading eyebrow="RESUMO FINANCEIRO" title="Visão geral" subtitle="Acompanhe sua vida financeira em um só lugar." action={<PrimaryButton onClick={() => onAdd("transaction")}>Nova movimentação</PrimaryButton>}/>
    <div className="stats-grid"><StatCard label="Saldo disponível" value={totals.balance} icon={Wallet} tone="purple" note="Seu dinheiro disponível"/><StatCard label="Entradas do mês" value={inc} icon={ArrowDownLeft} tone="green" note="Dinheiro que entrou"/><StatCard label="Despesas do mês" value={exp + data.purchases.filter(x=>String(x.occurred_at).slice(0,7)===month && x.payment_source==="balance").reduce((s,x)=>s+Number(x.amount),0)} icon={ArrowUpRight} tone="red" note="Dinheiro que saiu"/><StatCard label="Reserva financeira" value={totals.reserve} icon={PiggyBank} tone="blue" note="Dinheiro guardado"/></div>
    <div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Movimentação financeira</h2><p>Entradas e despesas nos últimos 6 meses</p></div><span className="period-pill"><CalendarDays size={14}/> 6 meses</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{top:10,right:8,left:-18,bottom:0}}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#25c58a" stopOpacity={.25}/><stop offset="95%" stopColor="#25c58a" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef6b75" stopOpacity={.18}/><stop offset="95%" stopColor="#ef6b75" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fill:"var(--muted)",fontSize:12}}/><YAxis tickLine={false} axisLine={false} tick={{fill:"var(--muted)",fontSize:11}} tickFormatter={v=>`R$${v}`}/><Tooltip formatter={v=>money(v)} contentStyle={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,color:"var(--text)"}}/><Area type="monotone" dataKey="entradas" stroke="#25c58a" fill="url(#incomeFill)" strokeWidth={2.5}/><Area type="monotone" dataKey="despesas" stroke="#ef6b75" fill="url(#expenseFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div><div className="chart-legend"><span><i className="dot green-dot"/>Entradas</span><span><i className="dot red-dot"/>Despesas</span></div></section>
      <section className="panel quick-panel"><div className="panel-heading"><div><h2>Ações rápidas</h2><p>O que deseja fazer agora?</p></div></div><button className="quick-action" onClick={()=>onAdd("transaction")}><span className="quick-icon green"><ArrowDownLeft/></span><span><strong>Adicionar entrada</strong><small>Registre um dinheiro recebido</small></span><Plus size={17}/></button><button className="quick-action" onClick={()=>onAdd("expense")}><span className="quick-icon red"><ArrowUpRight/></span><span><strong>Adicionar despesa</strong><small>Registre um gasto</small></span><Plus size={17}/></button><button className="quick-action" onClick={()=>onAdd("purchase")}><span className="quick-icon blue"><ShoppingBag/></span><span><strong>Registrar compra</strong><small>Adicione um produto comprado</small></span><Plus size={17}/></button><button className="quick-action" onClick={()=>onAdd("reserve")}><span className="quick-icon purple"><PiggyBank/></span><span><strong>Movimentar reserva</strong><small>Guardar ou retirar dinheiro</small></span><Plus size={17}/></button></section></div>
    <section className="panel recent-panel"><div className="panel-heading"><div><h2>Atividades recentes</h2><p>Suas últimas movimentações</p></div></div>{recent.length ? <div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Valor</th></tr></thead><tbody>{recent.map(x=><tr key={x.id}><td><div className="item-title"><span className={`mini-icon ${x.type==="income"?"green":x.type==="purchase"?"blue":"red"}`}>{x.type==="income"?<ArrowDownLeft size={15}/>:x.type==="purchase"?<ShoppingBag size={15}/>:<ArrowUpRight size={15}/>}</span>{x.description || x.title || x.name}</div></td><td>{x.category}</td><td>{dateLabel(x.occurred_at)}</td><td className={x.type==="income"?"positive":"negative"}>{x.type==="income"?"+":"−"} {money(x.amount)}</td></tr>)}</tbody></table></div>:<Empty text="Suas atividades aparecerão aqui quando você adicionar movimentações."/>}</section>
  </>;
}

function Transactions({ data, search, setSearch, onAdd, onDelete }) {
  const rows = data.transactions.filter(x => `${x.description} ${x.category}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageHeading eyebrow="CONTROLE FINANCEIRO" title="Movimentações" subtitle="Gerencie tudo o que entra e sai da sua conta." action={<PrimaryButton onClick={()=>onAdd("transaction")}>Nova movimentação</PrimaryButton>}/><section className="panel"><div className="list-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar movimentação..."/></div><span className="count-label">{rows.length} registros</span></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Data</th><th>Valor</th><th></th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><strong>{x.description}</strong></td><td><span className={`type-pill ${x.type}`}>{x.type==="income"?"Entrada":"Despesa"}</span></td><td>{x.category}</td><td>{dateLabel(x.occurred_at)}</td><td className={x.type==="income"?"positive":"negative"}>{x.type==="income"?"+":"−"} {money(x.amount)}</td><td><button className="icon-btn danger-hover" onClick={()=>onDelete("transaction",x.id)} aria-label="Excluir"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>:<Empty text="Nenhuma movimentação encontrada."/>}</section></>;
}

function Purchases({ data, search, setSearch, onAdd, onDelete }) {
  const rows = data.purchases.filter(x => `${x.name} ${x.category}`.toLowerCase().includes(search.toLowerCase()));
  const sum = rows.reduce((s,x)=>s+Number(x.amount),0);
  return <><PageHeading eyebrow="ACOMPANHAMENTO DE GASTOS" title="Minhas compras" subtitle="Registre produtos e acompanhe quanto já gastou." action={<PrimaryButton onClick={()=>onAdd("purchase")}>Adicionar compra</PrimaryButton>}/><div className="stats-grid compact-stats"><StatCard label="Total listado" value={sum} icon={ShoppingBag} tone="blue" note="Soma das compras exibidas"/><StatCard label="Quantidade de compras" value={rows.length} icon={CreditCard} tone="purple" note="Itens registrados" format="number"/></div><section className="panel"><div className="list-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..."/></div><span className="count-label">{rows.length} compras</span></div>{rows.length?<div className="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Pago com</th><th>Data</th><th>Valor</th><th></th></tr></thead><tbody>{rows.map(x=><tr key={x.id}><td><div className="item-title"><span className="mini-icon blue"><ShoppingBag size={15}/></span><strong>{x.name}</strong></div></td><td>{x.category}</td><td>{x.payment_source==="reserve"?"Reserva":"Saldo disponível"}</td><td>{dateLabel(x.occurred_at)}</td><td className="negative">− {money(x.amount)}</td><td><button className="icon-btn danger-hover" onClick={()=>onDelete("purchase",x.id)} aria-label="Excluir"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>:<Empty text="Você ainda não cadastrou compras."/>}</section></>;
}

function Reserve({ data, totals, onAdd, onDelete }) {
  const rows = data.reserveMoves;
  const deposits = rows.filter(x=>x.type==="deposit").reduce((s,x)=>s+Number(x.amount),0);
  const withdrawals = rows.filter(x=>x.type==="withdrawal").reduce((s,x)=>s+Number(x.amount),0);
  return <><PageHeading eyebrow="DINHEIRO GUARDADO" title="Minha reserva" subtitle="Acompanhe o dinheiro que você está guardando." action={<PrimaryButton onClick={()=>onAdd("reserve")}>Movimentar reserva</PrimaryButton>}/><div className="reserve-hero"><div><div className="reserve-label"><PiggyBank size={17}/> RESERVA DISPONÍVEL</div><div className="reserve-total">{money(totals.reserve)}</div><p>Esse é o valor líquido guardado na sua reserva.</p></div><div className="reserve-graphic"><div className="reserve-circle"><PiggyBank size={43}/></div></div></div><div className="stats-grid compact-stats"><StatCard label="Total guardado" value={deposits} icon={ArrowDownLeft} tone="green" note="Depósitos realizados"/><StatCard label="Total retirado" value={withdrawals+totals.purchases} icon={ArrowUpRight} tone="red" note="Retiradas e compras da reserva"/></div><section className="panel"><div className="panel-heading"><div><h2>Histórico da reserva</h2><p>Depósitos, retiradas e compras pagas com a reserva</p></div></div>{rows.length||data.purchases.some(x=>x.payment_source==="reserve")?<div className="table-wrap"><table><thead><tr><th>Descrição</th><th>Movimento</th><th>Data</th><th>Valor</th><th></th></tr></thead><tbody>{[...rows.map(x=>({...x,kind:"reserve"})),...data.purchases.filter(x=>x.payment_source==="reserve").map(x=>({...x,kind:"purchase",description:x.name,type:"purchase"}))].sort((a,b)=>new Date(b.occurred_at)-new Date(a.occurred_at)).map(x=><tr key={x.id}><td>{x.description || x.category || "Movimentação da reserva"}</td><td>{x.type==="deposit"?"Depósito":x.type==="withdrawal"?"Retirada":"Compra"}</td><td>{dateLabel(x.occurred_at)}</td><td className={x.type==="deposit"?"positive":"negative"}>{x.type==="deposit"?"+":"−"} {money(x.amount)}</td><td>{x.kind==="reserve"&&<button className="icon-btn danger-hover" onClick={()=>onDelete("reserve",x.id)}><Trash2 size={16}/></button>}</td></tr>)}</tbody></table></div>:<Empty text="Sua reserva ainda não tem movimentações."/>}</section></>;
}

function Reports({ data, totals }) {
  const categoriesMap = {};
  data.transactions.filter(x=>x.type==="expense").forEach(x=>categoriesMap[x.category]=(categoriesMap[x.category]||0)+Number(x.amount));
  data.purchases.forEach(x=>categoriesMap[x.category]=(categoriesMap[x.category]||0)+Number(x.amount));
  const pie = Object.entries(categoriesMap).map(([name,value])=>({name,value}));
  const colors = ["#25c58a","#7b72ed","#55a6e8","#e9a34b","#ed7182","#4db7b0","#9b82d4"];
  return <><PageHeading eyebrow="ANÁLISE FINANCEIRA" title="Relatórios" subtitle="Entenda para onde seu dinheiro está indo." action={<div className="export-actions"><button className="secondary-btn" onClick={()=>exportCSV(data)}>Exportar CSV</button><button className="primary-btn" onClick={()=>window.print()}><FileDown size={16}/>Salvar PDF</button></div>}/><div className="stats-grid"><StatCard label="Total de entradas" value={totals.income} icon={ArrowDownLeft} tone="green" note="Desde o início do controle"/><StatCard label="Despesas registradas" value={totals.expenses+totals.purchases} icon={ArrowUpRight} tone="red" note="Inclui compras cadastradas"/><StatCard label="Saldo disponível" value={totals.balance} icon={Wallet} tone="purple" note="Após movimentações e reserva"/><StatCard label="Reserva atual" value={totals.reserve} icon={PiggyBank} tone="blue" note="Dinheiro guardado"/></div><section className="panel report-panel"><div className="panel-heading"><div><h2>Gastos por categoria</h2><p>Despesas e compras registradas</p></div></div>{pie.length?<div className="report-content"><div className="pie-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={3}>{pie.map((x,i)=><Cell key={x.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={v=>money(v)} contentStyle={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12}}/></PieChart></ResponsiveContainer></div><div className="category-legend">{pie.sort((a,b)=>b.value-a.value).map((x,i)=><div key={x.name}><span><i className="dot" style={{background:colors[i%colors.length]}}/>{x.name}</span><strong>{money(x.value)}</strong></div>)}</div></div>:<Empty text="Adicione despesas ou compras para visualizar seus relatórios."/>}</section></>;
}

function SettingsPage({ isCloud, user, onRestartTutorial }) {
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  async function saveRecoveryCode(e) {
    e.preventDefault(); setCodeMessage("");
    const formElement = e.currentTarget;
    const code = String(new FormData(formElement).get("recoveryCode") || "").trim();
    if (!/^\d{6}$/.test(code)) { setCodeMessage("O código precisa ter exatamente 6 números."); return; }
    setCodeBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("password-recovery-code", { body: { action: "set", code } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "Não foi possível salvar o código.");
      setRecoveryCode(""); setCodeMessage("Código de recuperação atualizado. Guarde-o em um local seguro.");
      formElement.reset();
    } catch (err) { setCodeMessage(err?.name === "FunctionsFetchError" ? "Não foi possível alcançar a Edge Function. Publique password-recovery-code no Supabase e confira a URL e a chave anon do projeto." : (err.message || "Não foi possível salvar o código.")); }
    finally { setCodeBusy(false); }
  }
  async function changePassword(e) {
    e.preventDefault(); setPasswordMessage("");
    const formElement = e.currentTarget;
    if (!isCloud) { setPasswordMessage("A troca de senha fica disponível quando uma conta Supabase estiver conectada."); return; }
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    if (newPassword.length < 6) { setPasswordMessage("A nova senha precisa ter pelo menos 6 caracteres."); return; }
    if (currentPassword === newPassword) { setPasswordMessage("Escolha uma senha diferente da atual."); return; }
    setPasswordBusy(true);
    try {
      // Confirma a identidade com a senha atual; não envia e-mail nem depende do endereço existir.
      const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (authError) throw new Error("Senha atual incorreta. Confira e tente novamente.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      formElement.reset();
      setPasswordMessage("Senha alterada com sucesso. Você já pode usar a nova senha no próximo acesso.");
    } catch (error) { setPasswordMessage(error.message || "Não foi possível alterar a senha."); }
    finally { setPasswordBusy(false); }
  }
  return <><PageHeading eyebrow="PREFERÊNCIAS" title="Configurações" subtitle="Informações da sua conta e do ambiente Valtrix."/><section className="panel settings-panel"><div className="settings-row"><div className="settings-icon"><ShieldCheck/></div><div><strong>Tipo de armazenamento</strong><p>{isCloud?"Supabase — dados sincronizados na nuvem":"Modo local — dados salvos neste navegador"}</p></div><span className={`type-pill ${isCloud?"income":"expense"}`}>{isCloud?"Conectado":"Local"}</span></div><div className="settings-row"><div className="settings-icon"><Activity/></div><div><strong>Conta atual</strong><p>{user.email}</p></div></div><div className="settings-row"><div className="settings-icon"><KeyRound/></div><div style={{flex:1}}><strong>Alterar senha manualmente</strong><p>Não envia link por e-mail. É necessário estar conectado e informar a senha atual.</p><form className="entry-form" style={{marginTop:14,maxWidth:420}} onSubmit={changePassword}><label>Senha atual<div className="password-field"><input name="currentPassword" type={showCurrentPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Digite sua senha atual"/><button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(v => !v)} aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}>{showCurrentPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label><label>Nova senha<div className="password-field"><input name="newPassword" type={showNewPassword ? "text" : "password"} required minLength="6" autoComplete="new-password" placeholder="Mínimo de 6 caracteres"/><button type="button" className="password-toggle" onClick={() => setShowNewPassword(v => !v)} aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}>{showNewPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label><button className="primary-btn" disabled={passwordBusy}>{passwordBusy?"Alterando...":"Salvar nova senha"}</button>{passwordMessage&&<div className="form-message" role="status" style={{color:passwordMessage.includes("sucesso")?"#35d69c":undefined}}>{passwordMessage}</div>}</form></div></div><div className="settings-row"><div className="settings-icon"><KeyRound/></div><div style={{flex:1}}><strong>Código de recuperação de senha</strong><p>Crie ou atualize um código de 6 números. Ele será solicitado caso você esqueça sua senha. Guarde-o fora do Valtrix; por segurança, não será possível visualizar o código depois de salvar.</p>{isCloud ? <form className="entry-form" style={{marginTop:12,maxWidth:420}} onSubmit={saveRecoveryCode}><label>Novo código de 6 números<div className="password-field"><input name="recoveryCode" type={showRecoveryCode ? "text" : "password"} inputMode="numeric" pattern="[0-9]{6}" minLength="6" maxLength="6" required placeholder="Digite 6 números" autoComplete="new-password"/><button type="button" className="password-toggle" onClick={() => setShowRecoveryCode(v => !v)} aria-label={showRecoveryCode ? "Ocultar código" : "Mostrar código"}>{showRecoveryCode ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label><button className="primary-btn" disabled={codeBusy}>{codeBusy ? "Salvando..." : "Salvar código de recuperação"}</button>{codeMessage&&<div className="form-message" role="status">{codeMessage}</div>}</form> : <p>Conecte o Supabase para configurar a recuperação de senha.</p>}</div></div><div className="settings-row"><div className="settings-icon"><CircleHelp/></div><div><strong>Sobre o Valtrix</strong><p>Projeto educacional de controle financeiro desenvolvido com React e auxílio de IA.</p></div></div><div className="settings-row"><div className="settings-icon"><BookOpen/></div><div><strong>Guia de utilização</strong><p>Revise o passo a passo para conhecer todas as funcionalidades do Valtrix.</p></div><button className="secondary-btn" onClick={onRestartTutorial}>Rever tutorial</button></div></section></>;
}

function TutorialModal({ step, current, total, onNext, onPrevious, onSkip }) {
  const progress = `${(current / total) * 100}%`;
  return <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
    <section className="tutorial-card">
      <div className="tutorial-top"><div className="tutorial-brand"><span className="tutorial-brand-icon"><BookOpen size={18}/></span><div><strong>VALTRIX V5.4</strong><small>GUIA DE PRIMEIRO ACESSO</small></div></div><button className="icon-btn" onClick={onSkip} aria-label="Fechar tutorial"><X size={19}/></button></div>
      <div className="tutorial-progress"><span style={{width:progress}}/></div>
      <div className="tutorial-count">PASSO {current} DE {total}</div>
      <div className="tutorial-illustration"><PlayCircle size={34}/><span>{step.page === "dashboard" ? "Visão geral" : step.page === "transactions" ? "Movimentações" : step.page === "purchases" ? "Compras" : step.page === "reserve" ? "Reserva financeira" : step.page === "reports" ? "Relatórios" : step.page === "planning" ? "Planejamento" : step.title}</span></div>
      <h2 id="tutorial-title">{step.title}</h2><p className="tutorial-description">{step.description}</p>
      <div className="tutorial-tip"><strong>Dica</strong><p>{step.tip}</p></div>
      <div className="tutorial-actions"><button className="secondary-btn" onClick={onSkip}>Pular tutorial</button><div>{current > 1 && <button className="secondary-btn tutorial-back" onClick={onPrevious}><ChevronLeft size={16}/>Voltar</button>}<button className="primary-btn" onClick={onNext}>{current === total ? "Concluir" : "Próximo passo"}{current !== total && <ChevronRight size={16}/>}</button></div></div>
    </section>
  </div>;
}

function exportCSV(data) {
  const rows = [["Data","Tipo","Descrição","Categoria","Valor"],
    ...data.transactions.map(x=>[x.occurred_at,x.type,x.description,x.category,x.amount]),
    ...data.purchases.map(x=>[x.occurred_at,"purchase",x.name,x.category,x.amount])];
  const csv = "\uFEFF" + rows.map(row=>row.map(value=>`"${String(value??"").replaceAll('"','""')}"`).join(";")).join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"})); const a=document.createElement("a"); a.href=url; a.download=`valtrix-relatorio-${today()}.csv`; a.click(); URL.revokeObjectURL(url);
}

function Planning({data,onSave,onDelete,onUpdate,busy}) {
  const [tab,setTab]=useState("goals");
  const [notice,setNotice]=useState("");
  function submit(e){e.preventDefault();const f=new FormData(e.currentTarget);const amount=Number(f.get("amount"));if(!amount||amount<=0)return;
    const base={name:String(f.get("name")||"").trim(),amount,category:String(f.get("category")||"Outros")};
    if(tab==="goals") onSave("goals",{...base,target_date:f.get("date"),saved_amount:0});
    if(tab==="budgets") onSave("budgets",{...base,month:f.get("month")});
    if(tab==="recurring") onSave("recurring",{...base,frequency:f.get("frequency"),next_due:f.get("date"),active:true});
    e.currentTarget.reset();
  }
  const items=data[tab]||[];
  return <><PageHeading eyebrow="PLANEJAMENTO FINANCEIRO • V5" title="Planejamento" subtitle="Defina objetivos, controle limites e acompanhe contas recorrentes."/>
    <div className="planning-tabs">{[["goals","Metas"],["budgets","Orçamentos"],["recurring","Recorrentes"]].map(([id,label])=><button key={id} className={tab===id?"selected":""} onClick={()=>setTab(id)}>{label}</button>)}</div>
    <section className="panel planning-panel"><div className="panel-heading"><div><h2>{tab==="goals"?"Metas financeiras":tab==="budgets"?"Orçamentos mensais":"Despesas recorrentes"}</h2><p>{tab==="goals"?"Acompanhe quanto falta para alcançar seus objetivos.":tab==="budgets"?"Defina limites para cada categoria no mês.":"Organize contas que se repetem e suas próximas datas."}</p></div></div>
      <form className="planning-form" onSubmit={submit}><label>Nome<input name="name" required placeholder={tab==="goals"?"Ex.: Viagem":"Ex.: Internet"}/></label><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0,00"/></label>
      {tab!=="recurring"&&<label>Categoria<select name="category">{categories.map(c=><option key={c}>{c}</option>)}</select></label>}
      {tab==="goals"&&<label>Prazo<input name="date" type="date" required min={today()}/></label>}
      {tab==="budgets"&&<label>Mês<input name="month" type="month" required defaultValue={today().slice(0,7)}/></label>}
      {tab==="recurring"&&<><label>Frequência<select name="frequency"><option value="monthly">Mensal</option><option value="weekly">Semanal</option><option value="yearly">Anual</option></select></label><label>Próximo vencimento<input name="date" type="date" required min={today()}/></label></>}
      <button className="primary-btn" disabled={busy}><Plus size={16}/>Adicionar</button></form>
      <div className="planning-list">{items.length?items.map(item=><article className="planning-item" key={item.id}><div className="planning-item-top"><div><strong>{item.name}</strong><small>{tab==="goals"?`Prazo: ${dateLabel(item.target_date)}`:tab==="budgets"?`${item.category} • ${item.month}`:`${item.frequency==="weekly"?"Semanal":item.frequency==="yearly"?"Anual":"Mensal"} • Próxima: ${dateLabel(item.next_due)}`}</small></div><strong>{money(item.amount)}</strong></div>
      {tab==="goals"&&<><div className="progress-track"><span style={{width:`${Math.min(100,(Number(item.saved_amount||0)/Number(item.amount))*100)}%`}}/></div><div className="planning-item-bottom"><small>Guardado: {money(item.saved_amount||0)} de {money(item.amount)}</small><button className="text-btn" onClick={()=>{const value=Number(window.prompt("Quanto deseja adicionar ao valor guardado?", "0"));if(value>0)onUpdate("goals",item.id,{saved_amount:Number(item.saved_amount||0)+value});}}>Adicionar progresso</button></div></>}
      {tab==="budgets"&&<BudgetUsage item={item} data={data}/>}
      <div className="planning-item-actions"><button className="icon-btn danger-hover" onClick={()=>onDelete(tab,item.id)} aria-label="Excluir"><Trash2 size={16}/></button></div></article>):<Empty text="Ainda não há itens cadastrados nesta área."/>}</div>
    </section></>;
}
function BudgetUsage({item,data}){const spent=[...data.transactions.filter(x=>x.type==="expense"&&x.category===item.category&&String(x.occurred_at).slice(0,7)===item.month),...data.purchases.filter(x=>x.category===item.category&&String(x.occurred_at).slice(0,7)===item.month)].reduce((s,x)=>s+Number(x.amount),0);const pct=Math.min(100,spent/Number(item.amount)*100);return <><div className="progress-track"><span className={pct>=100?"over-budget":""} style={{width:`${pct}%`}}/></div><div className="planning-item-bottom"><small>Gasto: {money(spent)} • Restante: {money(Math.max(0,item.amount-spent))}</small><small>{pct.toFixed(0)}% utilizado</small></div></>}

function Empty({ text }) { return <div className="empty-state"><div className="empty-icon"><Activity size={22}/></div><strong>Nada por aqui ainda</strong><p>{text}</p></div>; }

function EntryModal({ type, onClose, onSave, busy }) {
  const isExpense = type==="expense";
  const title = type==="purchase"?"Adicionar compra":type==="reserve"?"Movimentar reserva":isExpense?"Adicionar despesa":"Adicionar entrada";
  const [reserveType,setReserveType] = useState("deposit");
  function submit(e) {
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const amount=Number(f.get("amount"));
    if (!amount || amount<=0) return;
    const common={amount,category:f.get("category"),occurred_at:f.get("date")};
    if(type==="purchase") onSave("purchase",{...common,name:f.get("name"),payment_source:f.get("source")});
    else if(type==="reserve") onSave("reserve",{...common,description:(f.get("description")||"").trim(),type:reserveType});
    else onSave("transaction",{...common,description:f.get("description")||"",type:isExpense?"expense":"income"});
  }
  return <Modal title={title} onClose={onClose}><form className="entry-form" onSubmit={submit}>
    {type==="purchase"&&<label>Nome do produto<input name="name" required placeholder="Ex.: SSD NVMe 256 GB"/></label>}
    {type==="reserve"&&<div className="segmented"><button type="button" className={reserveType==="deposit"?"selected":""} onClick={()=>setReserveType("deposit")}>Guardar dinheiro</button><button type="button" className={reserveType==="withdrawal"?"selected":""} onClick={()=>setReserveType("withdrawal")}>Retirar dinheiro</button></div>}
    {type!=="purchase"&&type!=="reserve"&&<label>Descrição<input name="description" required placeholder={isExpense?"Ex.: Conta de internet":"Ex.: Salário"}/></label>}
    <div className="form-two"><label>Valor (R$)<input name="amount" type="number" min="0.01" step="0.01" required placeholder="0,00"/></label><label>Data<input name="date" type="date" defaultValue={today()} required/></label></div>
    <label>Categoria<select name="category" defaultValue={type==="reserve"?"Reserva":""} required><option value="" disabled>Selecione uma categoria</option>{(type==="reserve"?["Reserva","Emergência","Objetivo","Outros"]:categories).map(x=><option key={x}>{x}</option>)}</select></label>
    {type==="purchase"&&<label>De onde sairá o dinheiro?<select name="source"><option value="balance">Saldo disponível</option><option value="reserve">Minha reserva</option></select><small className="field-help">O valor será descontado automaticamente do saldo escolhido.</small></label>}
    {type==="reserve"&&<label>Observação<input name="description" placeholder="Opcional"/></label>}
    <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button><button className="primary-btn" disabled={busy}>{busy?"Salvando...":"Salvar registro"}</button></div>
  </form></Modal>;
}

export default App;
