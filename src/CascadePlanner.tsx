import React, { useMemo, useState } from "react";
import { Plus, Trash2, Download, Cable, GitBranch } from "lucide-react";
import { calculateTopology, makeTopologyNode, NODE_LABELS, NodeKind, TopologyNode } from "./cascade";
import "./cascade.css";
const STORAGE_KEY = "optibudget.topology.v1";
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
  const ordered = [...nodes].sort((a,b)=>depth(a,nodes)-depth(b,nodes));
  return <div className="cascade-workspace">
    <div className="cascade-intro"><div className="cascade-icon"><GitBranch size={20}/></div><div><h2>Каскадная топология PON</h2><p>Создавайте разветвлённую схему OLT → волокно → PLC/FBT → абонентские ветки → ONT/ONU. Расчёт выполняется отдельно по пути каждого терминала.</p></div><button className="btn" onClick={exportTopology}><Download size={15}/> JSON</button></div>
    <div className="cascade-grid">
      <section className="panel cascade-editor">
        <div className="panel-heading"><div><h2>Узлы и соединения</h2><p>У каждого элемента, кроме OLT, выбран родительский узел.</p></div><Cable size={18}/></div>
        <div className="topology-toolbar"><label>Добавить к узлу<select value={selectedParent || olt?.id || ""} onChange={e=>setSelectedParent(e.target.value)}>{nodes.map(n=><option key={n.id} value={n.id}>{nodeIndent(n,nodes)}{n.name}</option>)}</select></label><div className="topology-add">{kinds.map(k=><button key={k} onClick={()=>add(k,selectedParent || olt?.id || null)}><Plus size={13}/>{NODE_LABELS[k]}</button>)}</div></div>
        <div className="topology-tree">{ordered.map(n=><article className={"topology-node kind-"+n.kind} key={n.id} style={{marginLeft:Math.min(32,depth(n,nodes)*12)}}><div className="topology-node-title"><span className="node-dot"/><strong>{n.name}</strong><span className="node-type">{NODE_LABELS[n.kind]}</span>{n.kind!=="olt"&&<button className="icon-btn" aria-label={`Удалить ${n.name} и дочерние узлы`} onClick={()=>remove(n.id)}><Trash2 size={14}/></button>}</div>
          <div className="node-fields"><label>Название<input value={n.name} onChange={e=>patch(n.id,{name:e.target.value})}/></label>
          {n.kind==="fiber"&&<><label>Длина, км<input type="number" min="0" step="0.1" value={n.lengthKm} onChange={e=>patch(n.id,{lengthKm:Number(e.target.value)})}/></label><label>Затухание, dB/км<input type="number" min="0" step="0.01" value={n.attenuationDbPerKm} onChange={e=>patch(n.id,{attenuationDbPerKm:Number(e.target.value)})}/></label></>}
          {n.kind==="olt"&&<label>TX, dBm<input type="number" step="0.1" value={n.txDbm??5} onChange={e=>patch(n.id,{txDbm:Number(e.target.value)})}/></label>}
          {["plc","fbt","splice","connector"].includes(n.kind)&&<label>Потери, dB<input type="number" min="0" step="0.1" value={n.insertionLossDb} onChange={e=>patch(n.id,{insertionLossDb:Number(e.target.value)})}/></label>}
          {n.kind==="ont"&&<><label>Чувствительность RX, dBm<input type="number" step="0.1" value={n.rxSensitivityDbm??-28} onChange={e=>patch(n.id,{rxSensitivityDbm:Number(e.target.value)})}/></label><label>Перегрузка RX, dBm<input type="number" step="0.1" value={n.rxOverloadDbm??-8} onChange={e=>patch(n.id,{rxOverloadDbm:Number(e.target.value)})}/></label></>}
          {n.kind!=="olt"&&<label>Подключён к<select value={n.parentId??""} onChange={e=>patch(n.id,{parentId:e.target.value||null})}>{nodes.filter(p=>p.id!==n.id&&!isDescendant(p.id,n.id,nodes)).map(p=><option key={p.id} value={p.id}>{p.name} · {NODE_LABELS[p.kind]}</option>)}</select></label>}
          </div><div className="node-loss">Потери элемента: <strong>{nfmt(n.kind==="fiber"?n.lengthKm*n.attenuationDbPerKm:n.insertionLossDb)} dB</strong></div>
        </article>)}</div>
        <p className="footnote">Значения сплиттеров являются вводимыми параметрами, а не паспортными значениями. В реальном проекте указывайте insertion loss для конкретного коэффициента деления и длины волны.</p>
      </section>
      <aside className="panel path-results"><div className="panel-heading"><div><h2>Уровень на ONT/ONU</h2><p>Расчётный путь от ближайшего родительского OLT</p></div></div>
        {results.length===0?<div className="empty">Добавьте один или несколько терминалов ONT/ONU.</div>:results.map(r=><div className="path-card" key={r.node.id}><div className="path-card-title"><strong>{r.node.name}</strong><span>{nfmt(r.rxDbm)} dBm</span></div><div className="path-sequence">{r.path.map(p=>p.name).join(" → ")||"Путь не определён"}</div><div className="path-metrics"><span>Потери <b>{nfmt(r.lossDb)} dB</b></span><span>Запас <b>{nfmt(r.marginDb??NaN)} dB</b></span></div><div className={"status "+(r.status==="В пределах заданных параметров"?"good":"warn")}>{r.status}</div></div>)}
        <button className="btn" onClick={()=>{persist(readNodes());setMessage("Топология восстановлена из локального сохранения.")}}>Перезагрузить сохранённую схему</button>
        {message&&<p className="footnote" role="status">{message}</p>}
      </aside>
    </div>
  </div>;
}
function depth(node:TopologyNode,nodes:TopologyNode[]):number { const byId=new Map(nodes.map(n=>[n.id,n])); let d=0,cur=node,seen=new Set<string>(); while(cur.parentId&&!seen.has(cur.id)){seen.add(cur.id);const p=byId.get(cur.parentId);if(!p)break;cur=p;d++;}return d; }
function nodeIndent(node:TopologyNode,nodes:TopologyNode[]):string { return "　".repeat(Math.min(6,depth(node,nodes))) }
function isDescendant(candidateId:string,nodeId:string,nodes:TopologyNode[]):boolean { const byId=new Map(nodes.map(n=>[n.id,n]));let cur=byId.get(candidateId);const seen=new Set<string>();while(cur?.parentId&&!seen.has(cur.id)){if(cur.parentId===nodeId)return true;seen.add(cur.id);cur=byId.get(cur.parentId);}return false; }
