import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Archive, Cable, Cloud, Download, GitBranch, MapPin, Plus, RadioTower, Save, Trash2 } from "lucide-react";
import CascadePlanner from "./CascadePlanner";
import CatalogManager from "./CatalogManager";
import SplitterCatalogSelect from "./SplitterCatalogSelect";
import MapPlanner from "./MapPlanner";
import CloudSync from "./CloudSync";
import type { CloudProject } from "./supabase";
import { DEFAULT_MAP_CENTER } from "./geo";
import "leaflet/dist/leaflet.css";
import { calculateBudget, createId, LineElement, makeElement, OpticalProfile, TECHNOLOGY_PRESETS, Technology } from "./domain";
import "./style.css";

type Saved = { id: string; title: string; createdAt: string; technology: Technology; profile: OpticalProfile; elements: LineElement[] };
const KEY = "optibudget.journal.v1";
const TOPOLOGY_KEY = "optibudget.topology.v1";
const MAP_KEY = "optibudget.map.v1";
const readJournal = (): Saved[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const fmt = (n: number) => Number(n).toFixed(2);
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };
function App() {
  const [technology, setTechnology] = useState<Technology>("GPON");
  const [profile, setProfile] = useState<OpticalProfile>({ ...TECHNOLOGY_PRESETS.GPON });
  const [title, setTitle] = useState("Новый расчёт GPON");
  const [elements, setElements] = useState<LineElement[]>([makeElement("fiber"), makeElement("plc"), makeElement("splice"), makeElement("connector")]);
  const [journal, setJournal] = useState<Saved[]>(readJournal);
  const [tab, setTab] = useState<"calculator" | "journal" | "catalog" | "topology" | "map" | "cloud">("calculator");
  const [notice, setNotice] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); setNotice("OptiBudget установлен на устройство."); };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches || (("standalone" in navigator) && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("beforeinstallprompt", onInstallPrompt); window.removeEventListener("appinstalled", onInstalled); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);
  async function installApp() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setNotice("Установка запущена. После установки OptiBudget появится на главном экране.");
      setInstallPrompt(null);
      return;
    }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setNotice(isIos ? "Чтобы установить приложение на iPhone/iPad: нажмите «Поделиться» в Safari, затем «На экран Домой»." : "Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран». Для установки откройте сайт по HTTPS.");
  }
  const result = useMemo(() => calculateBudget(profile, elements), [profile, elements]);
  function update(id: string, patch: Partial<LineElement>) { setElements(xs => xs.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function changeTechnology(t: Technology) { setTechnology(t); setProfile({ ...TECHNOLOGY_PRESETS[t] }); }
  function persist(next: Saved[]) { setJournal(next); localStorage.setItem(KEY, JSON.stringify(next)); }
  function save() {
    const item: Saved = { id: createId(), title: title.trim() || "Новый расчёт", createdAt: new Date().toISOString(), technology, profile: { ...profile }, elements: elements.map(x => ({ ...x })) };
    persist([item, ...journal]); setNotice("Расчёт сохранён в журнал.");
  }
  function load(item: Saved) { setTitle(item.title); setTechnology(item.technology); setProfile(item.profile); setElements(item.elements); setTab("calculator"); setNotice("Расчёт восстановлен из журнала."); }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), calculations: journal }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "optibudget-journal.json"; a.click(); URL.revokeObjectURL(url);
  }
  function getCloudSnapshot() {
    let topology_nodes: unknown[] = [];
    let map_routes: unknown[] = [];
    let map_center = { ...DEFAULT_MAP_CENTER };
    try { topology_nodes = JSON.parse(localStorage.getItem(TOPOLOGY_KEY) || "[]"); } catch {}
    try {
      const map = JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
      map_routes = map.routes || [];
      if (map.center) map_center = map.center;
    } catch {}
    return { title, technology, linear_profile: { ...profile }, linear_elements: elements.map(x => ({ ...x })), topology_nodes, map_routes, map_center };
  }
  function onLoadCloudProject(p: CloudProject) {
    setTitle(p.title);
    if (p.technology && p.technology in TECHNOLOGY_PRESETS) setTechnology(p.technology as Technology);
    if (p.linear_profile && typeof p.linear_profile === "object") setProfile({ ...TECHNOLOGY_PRESETS.GPON, ...(p.linear_profile as OpticalProfile) });
    if (Array.isArray(p.linear_elements) && p.linear_elements.length) setElements(p.linear_elements as LineElement[]);
    if (Array.isArray(p.topology_nodes)) localStorage.setItem(TOPOLOGY_KEY, JSON.stringify(p.topology_nodes));
    if (Array.isArray(p.map_routes)) localStorage.setItem(MAP_KEY, JSON.stringify({ center: p.map_center || DEFAULT_MAP_CENTER, routes: p.map_routes, draftPoints: [] }));
    setNotice(`Проект «${p.title}» загружен из облака.`);
    setTab("calculator");
  }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Cable size={22}/></div><div><strong>OptiBudget</strong><span>PON engineering tools</span></div></div>
      <div className="nav-label">РАБОЧАЯ ОБЛАСТЬ</div>
      <button className={tab === "calculator" ? "nav-item active" : "nav-item"} onClick={() => setTab("calculator")}><Activity size={18}/><span className="nav-text">Расчёт</span></button>
      <button className={tab === "journal" ? "nav-item active" : "nav-item"} onClick={() => setTab("journal")}><Archive size={18}/><span className="nav-text">Журнал</span><span className="count">{journal.length}</span></button>
      <button className={tab === "catalog" ? "nav-item active" : "nav-item"} onClick={() => setTab("catalog")}><RadioTower size={18}/><span className="nav-text">Каталог</span></button>
      <button className={tab === "topology" ? "nav-item active" : "nav-item"} onClick={() => setTab("topology")}><GitBranch size={18}/><span className="nav-text">Каскад</span></button>
      <button className={tab === "map" ? "nav-item active" : "nav-item"} onClick={() => setTab("map")}><MapPin size={18}/><span className="nav-text">Карта</span></button>
      <button className={tab === "cloud" ? "nav-item active" : "nav-item"} onClick={() => setTab("cloud")}><Cloud size={18}/><span className="nav-text">Облако</span></button>
      <div className="side-note">PWA · карта · Supabase<br/><small>Параметры MVP требуют проверки по паспортам</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">ОПТИЧЕСКОЕ ПРОЕКТИРОВАНИЕ / PON</div><h1>{tab === "calculator" ? "Расчёт оптического бюджета" : tab === "journal" ? "Журнал расчётов" : tab === "catalog" ? "Каталог оборудования" : tab === "map" ? "Карта трасс" : tab === "cloud" ? "Облако Supabase" : "Каскадная топология"}</h1></div><div className="header-actions"><span className={"offline " + (isOnline ? "" : "offline-state")}><i/> {isOnline ? "Онлайн" : "Офлайн"}</span>{!isInstalled && <button className="install-action" onClick={installApp}><Download size={15}/><span>Установить</span></button>}</div></header>
      {tab === "calculator" && <section className="mobile-summary" aria-live="polite"><div><span>Уровень RX</span><strong>{fmt(result.rxPowerDbm)} <small>dBm</small></strong></div><div><span>Потери</span><strong>{fmt(result.totalLossDb)} dB</strong></div><div className={result.withinSensitivity && result.withinOverload && result.designMarginDb >= 0 ? "mobile-summary-state good" : "mobile-summary-state warn"}>{result.status}</div></section>}
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      {tab === "calculator" && <>
        <section className="project-strip">
          <div className="project-name"><label htmlFor="project-title">Название проекта / линии</label><input id="project-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="field tech"><label>Технология PON</label><select value={technology} onChange={e => changeTechnology(e.target.value as Technology)}>{Object.keys(TECHNOLOGY_PRESETS).map(t => <option key={t}>{t}</option>)}</select></div>
          <button className="btn primary" onClick={save}><Save size={16}/> Сохранить расчёт</button>
        </section>
        <div className="layout-grid">
          <section className="panel line-panel">
            <div className="panel-heading"><div><h2>Элементы оптической линии</h2><p>От передатчика OLT до приёмника ONT/ONU. Элементы учитываются последовательно.</p></div><span className="step">01</span></div>
            <div className="profile-grid">
              {([["txDbm","TX, dBm"],["rxSensitivityDbm","Чувствительность RX, dBm"],["rxOverloadDbm","Перегрузка RX, dBm"],["designMarginDb","Проектный запас, dB"]] as const).map(([key,label]) => <label className="profile-field" key={key}>{label}<input type="number" step="0.1" value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: Number(e.target.value) }))}/></label>)}
            </div>
            <div className="table-head"><span>ТИП / КОМПОНЕНТ</span><span>КОЛ-ВО / ДЛИНА</span><span>ПАРАМЕТРЫ</span><span>ПОТЕРИ</span><span/></div>
            <div className="elements">
              {elements.map((e, i) => <div className="element-row" key={e.id}>
                <div className="element-name"><span className="element-index">{String(i + 1).padStart(2,"0")}</span><div className="element-title"><strong>{e.label}</strong><small>{e.kind.toUpperCase()}</small>{(e.kind === "plc" || e.kind === "fbt") && <SplitterCatalogSelect element={e} onChange={patch => update(e.id, patch)} />}</div></div>
                <div className="number-field">{e.kind === "fiber" ? <><input aria-label="Длина волокна, км" type="number" min="0" step="0.1" value={e.lengthKm} onChange={ev => update(e.id,{lengthKm:Number(ev.target.value)})}/><small>км</small></> : <><input aria-label="Количество компонентов" type="number" min="0" value={e.quantity} onChange={ev => update(e.id,{quantity:Number(ev.target.value)})}/><small>шт.</small></>}</div>
                <div className="number-field">{e.kind === "fiber" ? <><input aria-label="Затухание dB на км" type="number" min="0" step="0.01" value={e.attenuationDbPerKm} onChange={ev => update(e.id,{attenuationDbPerKm:Number(ev.target.value)})}/><small>dB/км</small></> : <><input aria-label="Потери компонента dB" type="number" min="0" step="0.1" value={e.insertionLossDb} onChange={ev => update(e.id,{insertionLossDb:Number(ev.target.value)})}/><small>dB/шт.</small></>}</div>
                <strong className="loss">{fmt(e.kind === "fiber" ? e.lengthKm * e.attenuationDbPerKm : e.quantity * e.insertionLossDb)} dB</strong>
                <button className="icon-btn" aria-label="Удалить элемент" onClick={() => setElements(xs => xs.filter(x => x.id !== e.id))}><Trash2 size={15}/></button>
              </div>)}
            </div>
            <div className="add-row"><span>Добавить элемент линии</span>{(["fiber","plc","fbt","splice","connector","other"] as const).map(k => <button key={k} onClick={() => setElements(xs => [...xs, makeElement(k)])}><Plus size={13}/>{({fiber:"Волокно",plc:"PLC",fbt:"FBT",splice:"Сварка",connector:"Коннектор",other:"Прочее"} as Record<string,string>)[k]}</button>)}</div>
            <p className="footnote">Длину магистрали измерьте на вкладке «Карта» и примените автопривязку к каскаду. PLC/FBT — из каталога. Параметры сверяйте с datasheet.</p>
          </section>
          <aside className="result-column">
            <section className="result-card"><div className="result-top"><span>ИТОГОВЫЙ БЮДЖЕТ</span><Activity size={18}/></div><div className="hero-metric">{fmt(result.rxPowerDbm)} <small>dBm</small></div><p>Расчётный уровень на приёмнике</p><div className={"status "+(result.withinSensitivity && result.withinOverload && result.designMarginDb >= 0 ? "good" : "warn")}>{result.status}</div><div className="metric-row"><span>Суммарные потери</span><strong>{fmt(result.totalLossDb)} dB</strong></div><div className="metric-row"><span>Запас до чувствительности</span><strong>{fmt(result.marginDb)} dB</strong></div><div className="metric-row"><span>Запас сверх проектного</span><strong>{fmt(result.designMarginDb)} dB</strong></div><div className="power-scale"><div className="scale-track"><span style={{left: Math.max(0,Math.min(100,(result.rxPowerDbm+35)/35*100))+"%"}}/></div><div><span>−35 dBm</span><span>0 dBm</span></div></div></section>
            <section className="panel"><div className="panel-heading"><div><h2>Состав линии</h2><p>Вклад компонентов в потери</p></div></div>{elements.map(e => <div className="breakdown" key={e.id}><span>{e.label}</span><strong>{fmt(e.kind === "fiber" ? e.lengthKm*e.attenuationDbPerKm : e.quantity*e.insertionLossDb)} dB</strong></div>)}</section>
          </aside>
        </div>
      </>}
      {tab === "topology" && <CascadePlanner />}
      {tab === "map" && <MapPlanner />}
      {tab === "cloud" && <CloudSync getSnapshot={getCloudSnapshot} onLoadProject={onLoadCloudProject} />}
      {tab === "journal" && <section className="panel journal"><div className="panel-heading"><div><h2>Сохранённые расчёты</h2><p>Снимки конфигурации хранятся в браузере на этом устройстве.</p></div><button className="btn" onClick={exportJson}><Download size={15}/> Экспорт JSON</button></div>{journal.length === 0 ? <div className="empty">Расчётов пока нет. Сохраните расчёт на вкладке «Расчёт».</div> : journal.map(item => <div className="journal-item" key={item.id}><div><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString("ru-RU")} · {item.technology} · {item.elements.length} элементов</small></div><button className="btn" onClick={() => load(item)}>Открыть</button><button className="icon-btn" aria-label="Удалить расчёт" onClick={() => persist(journal.filter(x => x.id !== item.id))}><Trash2 size={15}/></button></div>)}</section>}
      {tab === "catalog" && <CatalogManager />}
      <footer>OptiBudget v0.2 · карта трасс + Supabase · инженерная оценка, не заменяет datasheet.</footer>
    </main>
  </div>;
}
createRoot(document.getElementById("root")!).render(<App />);
