import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Archive, Cable, Download, Plus, RadioTower, Save, Trash2 } from "lucide-react";
import { calculateBudget, createId, LineElement, makeElement, OpticalProfile, TECHNOLOGY_PRESETS, Technology, VENDOR_CATALOG } from "./domain";
import "./style.css";

type Saved = { id: string; title: string; createdAt: string; technology: Technology; profile: OpticalProfile; elements: LineElement[] };
const KEY = "optibudget.journal.v1";
const readJournal = (): Saved[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
const fmt = (n: number) => Number(n).toFixed(2);
function App() {
  const [technology, setTechnology] = useState<Technology>("GPON");
  const [profile, setProfile] = useState<OpticalProfile>({ ...TECHNOLOGY_PRESETS.GPON });
  const [title, setTitle] = useState("Новый расчёт GPON");
  const [elements, setElements] = useState<LineElement[]>([makeElement("fiber"), makeElement("plc"), makeElement("splice"), makeElement("connector")]);
  const [journal, setJournal] = useState<Saved[]>(readJournal);
  const [tab, setTab] = useState<"calculator" | "journal" | "catalog">("calculator");
  const [notice, setNotice] = useState("");
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
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Cable size={22}/></div><div><strong>OptiBudget</strong><span>PON engineering tools</span></div></div>
      <div className="nav-label">РАБОЧАЯ ОБЛАСТЬ</div>
      <button className={tab === "calculator" ? "nav-item active" : "nav-item"} onClick={() => setTab("calculator")}><Activity size={18}/> Расчёт линии</button>
      <button className={tab === "journal" ? "nav-item active" : "nav-item"} onClick={() => setTab("journal")}><Archive size={18}/> Журнал <span className="count">{journal.length}</span></button>
      <button className={tab === "catalog" ? "nav-item active" : "nav-item"} onClick={() => setTab("catalog")}><RadioTower size={18}/> Каталог</button>
      <div className="side-note">PWA · локальная работа<br/><small>Параметры MVP требуют проверки по паспортам</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">ОПТИЧЕСКОЕ ПРОЕКТИРОВАНИЕ / PON</div><h1>{tab === "calculator" ? "Расчёт оптического бюджета" : tab === "journal" ? "Журнал расчётов" : "Каталог оборудования"}</h1></div><span className="offline"><i/> Локальный режим</span></header>
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
                <div className="element-name"><span className="element-index">{String(i + 1).padStart(2,"0")}</span><div><strong>{e.label}</strong><small>{e.kind.toUpperCase()}</small></div></div>
                <div className="number-field">{e.kind === "fiber" ? <><input aria-label="Длина волокна, км" type="number" min="0" step="0.1" value={e.lengthKm} onChange={ev => update(e.id,{lengthKm:Number(ev.target.value)})}/><small>км</small></> : <><input aria-label="Количество компонентов" type="number" min="0" value={e.quantity} onChange={ev => update(e.id,{quantity:Number(ev.target.value)})}/><small>шт.</small></>}</div>
                <div className="number-field">{e.kind === "fiber" ? <><input aria-label="Затухание dB на км" type="number" min="0" step="0.01" value={e.attenuationDbPerKm} onChange={ev => update(e.id,{attenuationDbPerKm:Number(ev.target.value)})}/><small>dB/км</small></> : <><input aria-label="Потери компонента dB" type="number" min="0" step="0.1" value={e.insertionLossDb} onChange={ev => update(e.id,{insertionLossDb:Number(ev.target.value)})}/><small>dB/шт.</small></>}</div>
                <strong className="loss">{fmt(e.kind === "fiber" ? e.lengthKm * e.attenuationDbPerKm : e.quantity * e.insertionLossDb)} dB</strong>
                <button className="icon-btn" aria-label="Удалить элемент" onClick={() => setElements(xs => xs.filter(x => x.id !== e.id))}><Trash2 size={15}/></button>
              </div>)}
            </div>
            <div className="add-row"><span>Добавить элемент линии</span>{(["fiber","plc","fbt","splice","connector","other"] as const).map(k => <button key={k} onClick={() => setElements(xs => [...xs, makeElement(k)])}><Plus size={13}/>{({fiber:"Волокно",plc:"PLC",fbt:"FBT",splice:"Сварка",connector:"Коннектор",other:"Прочее"} as Record<string,string>)[k]}</button>)}</div>
            <p className="footnote">Потери PLC/FBT задаются вручную для выбранного делителя. Для каскада добавьте каждый сплиттер отдельной строкой. Учитывайте длину волны, класс оптики, запас и паспортные значения.</p>
          </section>
          <aside className="result-column">
            <section className="result-card"><div className="result-top"><span>ИТОГОВЫЙ БЮДЖЕТ</span><Activity size={18}/></div><div className="hero-metric">{fmt(result.rxPowerDbm)} <small>dBm</small></div><p>Расчётный уровень на приёмнике</p><div className={"status "+(result.withinSensitivity && result.withinOverload && result.designMarginDb >= 0 ? "good" : "warn")}>{result.status}</div><div className="metric-row"><span>Суммарные потери</span><strong>{fmt(result.totalLossDb)} dB</strong></div><div className="metric-row"><span>Запас до чувствительности</span><strong>{fmt(result.marginDb)} dB</strong></div><div className="metric-row"><span>Запас сверх проектного</span><strong>{fmt(result.designMarginDb)} dB</strong></div><div className="power-scale"><div className="scale-track"><span style={{left: Math.max(0,Math.min(100,(result.rxPowerDbm+35)/35*100))+"%"}}/></div><div><span>−35 dBm</span><span>0 dBm</span></div></div></section>
            <section className="panel"><div className="panel-heading"><div><h2>Состав линии</h2><p>Вклад компонентов в потери</p></div></div>{elements.map(e => <div className="breakdown" key={e.id}><span>{e.label}</span><strong>{fmt(e.kind === "fiber" ? e.lengthKm*e.attenuationDbPerKm : e.quantity*e.insertionLossDb)} dB</strong></div>)}</section>
          </aside>
        </div>
      </>}
      {tab === "journal" && <section className="panel journal"><div className="panel-heading"><div><h2>Сохранённые расчёты</h2><p>Снимки конфигурации хранятся в браузере на этом устройстве.</p></div><button className="btn" onClick={exportJson}><Download size={15}/> Экспорт JSON</button></div>{journal.length === 0 ? <div className="empty">Расчётов пока нет. Сохраните расчёт на вкладке «Расчёт линии».</div> : journal.map(item => <div className="journal-item" key={item.id}><div><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString("ru-RU")} · {item.technology} · {item.elements.length} элементов</small></div><button className="btn" onClick={() => load(item)}>Открыть</button><button className="icon-btn" aria-label="Удалить расчёт" onClick={() => persist(journal.filter(x => x.id !== item.id))}><Trash2 size={15}/></button></div>)}</section>}
      {tab === "catalog" && <section className="panel catalog"><div className="panel-heading"><div><h2>Стартовый каталог производителей</h2><p>Список для ориентира; конкретные модели и паспортные параметры добавляются отдельно.</p></div></div><div className="catalog-grid">{VENDOR_CATALOG.map(v => <div className="vendor-card" key={v.vendor}><strong>{v.vendor}</strong><span>{v.category}</span><small>{v.note}</small></div>)}</div><div className="warning">Не используйте стартовые параметры профилей как подтверждённые спецификации конкретного оборудования. Перед проектированием сверяйте TX, чувствительность, перегрузку и insertion loss с паспортами.</div></section>}
      <footer>OptiBudget MVP · расчёт инженерной оценки, не заменяет проверку проектных норм и datasheet компонентов.</footer>
    </main>
  </div>;
}
createRoot(document.getElementById("root")!).render(<App />);
