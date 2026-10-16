import React, { useMemo, useState } from "react";
import { Plus, Trash2, Download, Cable, GitBranch } from "lucide-react";
import { calculateTopology, makeTopologyNode, NODE_LABELS, NodeKind, TopologyNode, OPTICAL_CLASS_BUDGET_DB, OpticalClass, WAVELENGTHS_NM } from "./cascade";
import "./cascade.css";
const STORAGE_KEY = "optibudget.topology.v1";
const CATALOG_KEY = "optibudget.catalog.v1";
type CatalogEntry = {id:string;vendor:string;model:string;category:string;technology:string;txMinDbm:number|null;txMaxDbm:number|null;rxSensitivityDbm:number|null;rxOverloadDbm:number|null;insertionLossDb:number|null;sourceUrl:string;verifiedAt:string;notes:string};
function readCatalog():CatalogEntry[]{try{return JSON.parse(localStorage.getItem(CATALOG_KEY)||"[]") as CatalogEntry[]}catch{return []}}
const readNodes = (): TopologyNode[] => {
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) return JSON.parse(saved) as TopologyNode[]; } catch {}
  const olt = makeTopologyNode("olt",null);
  const fiber = makeTopologyNode("fiber",olt.id); fiber.name = "Магистраль до сплиттера";
  const splitter = makeTopologyNode("plc",fiber.id);
  const branch = makeTopologyNode("fiber",splitter.id); branch.name = "Абонентская ветка";
  const ont = makeTopologyNode("ont",branch.id);
  return [olt,fiber,splitter,branch,ont];
};
const nfmt = (n:number) => Number.isFinite(n) ? n.toFixed(2) : "—";
const kinds: NodeKind[] = ["fiber","plc","fbt","splice","connector","ont"];
export default function CascadePlanner() {
  const [nodes,setNodes] = useState<TopologyNode[]>(readNodes);
  const [catalog] = useState<CatalogEntry[]>(readCatalog);
  const [selectedParent,setSelectedParent] = useState("");
  const [message,setMessage] = useState("");
  const results = useMemo(()=>calculateTopology(nodes),[nodes]);
  const olt = nodes.find(n=>n.kind==="olt");
  function persist(next:TopologyNode[]) { setNodes(next); localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); }
  function patch(id:string,changes:Partial<TopologyNode>) { persist(nodes.map(n=>n.id===id?{...n,...changes}:n)); }
  function add(kind:NodeKind,parentId:string|null) {
    const parent = parentId ?? olt?.id ?? null;
    const item = makeTopologyNode(kind,parent);
    persist([...nodes,item]); setSelectedParent(item.id); setMessage(`Добавлен элемент: ${NODE_LABELS[kind]}`);
  }
  function remove(id:string) {
    const removed = new Set([id]); let changed = true;
    while(changed) { changed=false; for(const n of nodes) if(n.parentId && removed.has(n.parentId) && !removed.has(n.id)){removed.add(n.id);changed=true;} }
    persist(nodes.filter(n=>!removed.has(n.id)));
  }
  function exportTopology() {
    const blob = new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),nodes,results},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="optibudget-topology.json"; a.click(); URL.revokeObjectURL(url);
  }
  function applyCatalog(node:TopologyNode,itemId:string) {
    const item=catalog.find(x=>x.id===itemId);
    if(!item){patch(node.id,{catalogItemId:""});return;}
    const changes:Partial<TopologyNode>={catalogItemId:item.id};
    if(node.kind==="olt"&&item.txMaxDbm!==null)changes.txDbm=item.txMaxDbm;
    if(node.kind==="ont"){
      if(item.rxSensitivityDbm!==null)changes.rxSensitivityDbm=item.rxSensitivityDbm;
      if(item.rxOverloadDbm!==null)changes.rxOverloadDbm=item.rxOverloadDbm;
    }
    if(["plc","fbt","splice","connector"].includes(node.kind)&&item.insertionLossDb!==null)changes.insertionLossDb=item.insertionLossDb;
    if(item.model)changes.name=item.vendor+" "+item.model;
    patch(node.id,changes);
  }
  function exportReportCsv(){
    const rows=[["ONT/ONU","RX dBm","Потери dB","Запас чувствительности dB","Бюджет класса dB","Запас бюджета dB","Длина волны OLT nm","Класс оптики","Статус","Путь"]];
    for(const r of results){const root=r.path[0];rows.push([r.node.name,nfmt(r.rxDbm),nfmt(r.lossDb),nfmt(r.marginDb??NaN),nfmt(r.opticalBudgetDb??NaN),nfmt(r.designMarginDb??NaN),String(root?.wavelengthNm??""),root?.opticalClass??"",r.status,r.path.map(p=>p.name).join(" → ")]);}
    const csv="\uFEFF"+rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="optibudget-ont-report.csv";a.click();URL.revokeObjectURL(url);
  }
  const ordered = [...nodes].sort((a,b)=>depth(a,nodes)-depth(b,nodes));
  return <div className="cascade-workspace">
    <div className="cascade-intro"><div className="cascade-icon"><GitBranch size={20}/></div><div><h2>Каскадная топология PON</h2><p>Создавайте разветвлённую схему OLT → волокно → PLC/FBT → абонентские ветки → ONT/ONU. Расчёт выполняется отдельно по пути каждого терминала.</p></div><div className="topology-report-actions"><button className="btn" onClick={exportTopology}><Download size={15}/> JSON</button><button className="btn" onClick={exportReportCsv}><Download size={15}/> Отчёт CSV</button><button className="btn" onClick={()=>window.print()}>Печать / PDF</button></div></div>
    <div className="cascade-grid">
      <section className="panel cascade-editor">
        <div className="panel-heading"><div><h2>Узлы и соединения</h2><p>У каждого элемента, кроме OLT, выбран родительский узел.</p></div><Cable size={18}/></div>
        <div className="topology-toolbar"><label>Добавить к узлу<select value={selectedParent || olt?.id || ""} onChange={e=>setSelectedParent(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{nodeIndent(n,nodes)}{n.name}</option>)}</select></label><div className="topology-add">{kinds.map(k=><button key={k} onClick={()=>add(k,selectedParent || olt?.id || null)}><Plus size={13}/>{NODE_LABELS[k]}</button>)}</div></div>
        <div className="topology-tree">{ordered.map(n=><article className={"topology-node kind-"+n.kind} key={n.id} style={{marginLeft:Math.min(32,depth(n,nodes)*12)}}><div className="topology-node-title"><span className="node-dot"/><strong>{n.name}</strong><span className="node-type">{NODE_LABELS[n.kind]}</span>{n.kind!=="olt"&&<button className="icon-btn" aria-label={`Удалить ${n.name} и дочерние узлы`} onClick={()=>remove(n.id)}><Trash2 size={14}/></button>}</div>
          <div className="node-fields"><label>Название<input value={n.name} onChange={e=>patch(n.id,{name:e.target.value})}/></label>
          {n.kind==="fiber"&&<><label>Длина, км<input type="number" min="0" step="0.1" value={n.lengthKm} onChange={e=>patch(n.id,{lengthKm:Number(e.target.value)})}/></label><label>Затухание, dB/км<input type="number" min="0" step="0.01" value={n.attenuationDbPerKm} onChange={e=>patch(n.id,{attenuationDbPerKm:Number(e.target.value)})}/></label></>}
          {n.kind==="olt"&&<><label>Длина волны, nm<select value={n.wavelengthNm??1490} onChange={e=>patch(n.id,{wavelengthNm:Number(e.target.value)})}>{WAVELENGTHS_NM.map(w=><option key={w} value={w}>{w} nm</option>)}</select></label><label>TX, dBm<input type="number" step="0.1" value={n.txDbm??5} onChange={e=>patch(n.id,{txDbm:Number(e.target.value)})}/></label><label>Класс оптики<select value={n.opticalClass??"Custom"} onChange={e=>{const opticalClass=e.target.value as OpticalClass;patch(n.id,{opticalClass,opticalBudgetDb:OPTICAL_CLASS_BUDGET_DB[opticalClass]});}}>{Object.keys(OPTICAL_CLASS_BUDGET_DB).map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Бюджет класса, dB<input type="number" min="0" step="0.1" value={n.opticalBudgetDb??28} onChange={e=>patch(n.id,{opticalBudgetDb:Number(e.target.value)})}/></label></>}
          {["plc","fbt","splice","connector"].includes(n.kind)&&<label>Потери, dB<input type="number" min="0" step="0.1" value={n.insertionLossDb} onChange={e=>patch(n.id,{insertionLossDb:Number(e.target.value)})}/></label>}
          {n.kind==="ont"&&<><label>Длина волны, nm<select value={n.wavelengthNm??1490} onChange={e=>patch(n.id,{wavelengthNm:Number(e.target.value)})}>{WAVELENGTHS_NM.map(w=><option key={w} value={w}>{w} nm</option>)}</select></label><label>Чувствительность RX, dBm<input type="number" step="0.1" value={n.rxSensitivityDbm??-28} onChange={e=>patch(n.id,{rxSensitivityDbm:Number(e.target.value)})}/></label><label>Перегрузка RX, dBm<input type="number" step="0.1" value={n.rxOverloadDbm??-8} onChange={e=>patch(n.id,{rxOverloadDbm:Number(e.target.value)})}/></label></>}
          {n.kind!=="ont"&&n.kind!=="olt"&&<label>Длина волны, nm<select value={n.wavelengthNm??1490} onChange={e=>patch(n.id,{wavelengthNm:Number(e.target.value)})}>{WAVELENGTHS_NM.map(w=><option key={w} value={w}>{w} nm</option>)}</select></label>}
          {(n.kind==="olt"||n.kind==="ont"||["plc","fbt","splice","connector"].includes(n.kind))&&<label className="catalog-bind">Модель из каталога<select value={n.catalogItemId??""} onChange={e=>applyCatalog(n,e.target.value)}><option value="">Не привязана</option>{catalog.filter(x=>{const cats=n.kind==="olt"?["OLT"]:n.kind==="ont"?["ONT/ONU"]:n.kind==="plc"?["PLC"]:n.kind==="fbt"?["FBT"]:["Optical module"];return cats.includes(x.category)}).map(x=><option key={x.id} value={x.id}>{x.vendor} {x.model||"(модель не указана)"}</option>)}</select></label>}
          {n.kind!=="olt"&&<label>Подключён к<select value={n.parentId??""} onChange={e=>patch(n.id,{parentId:e.target.value||null})}>{nodes.filter(p=>p.id!==n.id&&!isDescendant(p.id,n.id,nodes)).map(p=><option key={p.id} value={p.id}>{p.name} · {NODE_LABELS[p.kind]}</option>)}</select></label>}
          </div><div className="node-loss">Потери элемента: <strong>{nfmt(n.kind==="fiber"?n.lengthKm*n.attenuationDbPerKm:n.insertionLossDb)} dB</strong></div>
        </article>)}</div>
        <p className="footnote">Значения сплиттеров являются вводимыми параметрами, а не паспортными значениями. В реальном проекте указывайте insertion loss для конкретного коэффициента деления и длины волны.</p>
      </section>
      <aside className="panel path-results"><div className="panel-heading"><div><h2>Уровень на ONT/ONU</h2><p>Расчётный путь от ближайшего родительского OLT</p></div></div>
        {results.length===0?<div className="empty">Добавьте один или несколько терминалов ONT/ONU.</div>:results.map(r=><div className="path-card" key={r.node.id}><div className="path-card-title"><strong>{r.node.name}</strong><span>{nfmt(r.rxDbm)} dBm</span></div><div className="path-sequence">{r.path.map(p=>p.name).join(" → ")||"Путь не определён"}</div><div className="path-metrics"><span>Потери <b>{nfmt(r.lossDb)} dB</b></span><span>Запас RX <b>{nfmt(r.marginDb??NaN)} dB</b></span></div><div className="path-metrics"><span>Бюджет класса <b>{nfmt(r.opticalBudgetDb??NaN)} dB</b></span><span>Остаток <b>{nfmt(r.designMarginDb??NaN)} dB</b></span></div><div className="path-meta">Длина волны OLT: {r.path[0]?.wavelengthNm??"—"} nm · Класс: {r.path[0]?.opticalClass??"—"}</div><div className={"status "+(r.status==="В пределах заданных параметров"?"good":"warn")}>{r.status}</div></div>)}
        <button className="btn" onClick={()=>{persist(readNodes());setMessage("Топология восстановлена из локального сохранения.")}}>Перезагрузить сохранённую схему</button>
        {message&&<p className="footnote" role="status">{message}</p>}
      </aside>
    </div>
  </div>;
}
function depth(node:TopologyNode,nodes:TopologyNode[]):number { const byId=new Map(nodes.map(n=>[n.id,n])); let d=0,cur=node,seen=new Set<string>(); while(cur.parentId&&!seen.has(cur.id)){seen.add(cur.id);const p=byId.get(cur.parentId);if(!p)break;cur=p;d++;}return d; }
function nodeIndent(node:TopologyNode,nodes:TopologyNode[]):string { return "　".repeat(Math.min(6,depth(node,nodes))) }
function isDescendant(candidateId:string,nodeId:string,nodes:TopologyNode[]):boolean { const byId=new Map(nodes.map(n=>[n.id,n]));let cur=byId.get(candidateId);const seen=new Set<string>();while(cur?.parentId&&!seen.has(cur.id)){if(cur.parentId===nodeId)return true;seen.add(cur.id);cur=byId.get(cur.parentId);}return false; }
