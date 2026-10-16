import React,{useMemo,useState} from "react";
import {Download,Plus,Save,Trash2, Pencil, X} from "lucide-react";
import {CatalogItem,STARTER_CATALOG} from "./catalog";
import "./catalog.css";
const KEY="optibudget.catalog.v1";
const read=():CatalogItem[]=>{
 try{
  const raw=localStorage.getItem(KEY);
  if(raw){
   const saved=JSON.parse(raw) as CatalogItem[];
   const byId=new Map(saved.map(x=>[x.id,x]));
   return [...STARTER_CATALOG.map(seed=>byId.get(seed.id)??{...seed}),...saved.filter(x=>!STARTER_CATALOG.some(seed=>seed.id===x.id))];
  }
 }catch{}
 return STARTER_CATALOG.map(x=>({...x}));
};
const categories:CatalogItem["category"][]=["OLT","ONT/ONU","PLC","FBT","Optical module","Fiber"];
const fields:[keyof CatalogItem,string][]=[["txMinDbm","TX min, dBm"],["txMaxDbm","TX max, dBm"],["rxSensitivityDbm","RX чувствительность, dBm"],["rxOverloadDbm","RX перегрузка, dBm"],["insertionLossDb","Insertion loss, dB"],["attenuationDbPerKm","Затухание волокна, dB/км"]];
const blankItem=(id:string):CatalogItem=>({id,vendor:"",model:"",category:"ONT/ONU",technology:"",txMinDbm:null,txMaxDbm:null,rxSensitivityDbm:null,rxOverloadDbm:null,insertionLossDb:null,attenuationDbPerKm:null,sourceUrl:"",verifiedAt:"",dataStatus:"template",notes:"Укажите точную модель и подтвердите параметры по официальному datasheet."});
export default function CatalogManager(){
 const [items,setItems]=useState<CatalogItem[]>(read);
 const [filter,setFilter]=useState("");
 const [saved,setSaved]=useState("Изменения хранятся локально до сохранения.");
 const [editingId,setEditingId]=useState<string|null>(null);
 const [draft,setDraft]=useState<CatalogItem|null>(null);
 const visible=useMemo(()=>items.filter(x=>[x.vendor,x.model,x.category,x.technology,x.notes,x.sourceUrl].join(" ").toLowerCase().includes(filter.toLowerCase())),[items,filter]);
 function update(id:string,patch:Partial<CatalogItem>){setItems(old=>old.map(x=>x.id===id?{...x,...patch}:x));setSaved("Есть несохранённые изменения.");}
 function openEdit(item:CatalogItem){setEditingId(item.id);setDraft({...item});}
 function openAdd(){const id=globalThis.crypto?.randomUUID?.()??`catalog-${Date.now()}`;setEditingId(id);setDraft(blankItem(id));}
 function patchDraft(patch:Partial<CatalogItem>){setDraft(old=>old?{...old,...patch}:old);}
 function commitDraft(){if(!draft)return;setItems(old=>old.some(x=>x.id===draft.id)?old.map(x=>x.id===draft.id?draft:x):[draft,...old]);setSaved("Есть несохранённые изменения.");setDraft(null);setEditingId(null);}
 function save(){localStorage.setItem(KEY,JSON.stringify(items));setSaved("Каталог сохранён в этом браузере.");}
 function exportData(){const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),items},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="optibudget-equipment-catalog.json";a.click();URL.revokeObjectURL(url);}
 const fmt=(v:number|null|undefined)=>v===null||v===undefined?"—":String(v);
 return <section className="panel catalog-manager"><div className="panel-heading"><div><h2>Каталог оборудования и компонентов</h2><p>Таблица моделей с отдельным окном создания и редактирования записи.</p></div><div className="catalog-actions"><button className="btn" onClick={openAdd}><Plus size={14}/> Добавить модель</button><button className="btn" onClick={exportData}><Download size={14}/> JSON</button><button className="btn primary" onClick={save}><Save size={14}/> Сохранить</button></div></div>
 <div className="catalog-filter"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Поиск по производителю, модели, типу, технологии или источнику"/><span>{visible.length} из {items.length}</span></div>
 <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Производитель / модель</th><th>Категория</th><th>Технология</th><th>TX, dBm</th><th>RX sensitivity</th><th>Потери, dB</th><th>Источник / статус</th><th>Действия</th></tr></thead><tbody>
 {visible.map(item=><tr key={item.id}><td><strong>{item.vendor||"Без производителя"}</strong><span>{item.model||"Модель не указана"}</span><small>{item.id}</small></td><td>{item.category}</td><td>{item.technology||"—"}</td><td>{item.txMinDbm===null||item.txMinDbm===undefined? "—":item.txMinDbm}{item.txMaxDbm===null||item.txMaxDbm===undefined?"":` … ${item.txMaxDbm}`}</td><td>{fmt(item.rxSensitivityDbm)}</td><td>{item.insertionLossDb!==null&&item.insertionLossDb!==undefined?fmt(item.insertionLossDb):item.attenuationDbPerKm!==null&&item.attenuationDbPerKm!==undefined?`${item.attenuationDbPerKm} dB/km`:"—"}</td><td><span className={`catalog-status ${item.dataStatus==="datasheet"?"sourced":"template"}`}>{item.dataStatus==="datasheet"?"Datasheet":"Шаблон"}</span>{item.sourceUrl&&<a className="catalog-source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">Открыть источник</a>}</td><td><div className="catalog-row-actions"><button className="icon-btn" title="Редактировать" aria-label={`Редактировать ${item.vendor} ${item.model}`} onClick={()=>openEdit(item)}><Pencil size={14}/></button><button className="icon-btn danger" title="Удалить" aria-label={`Удалить ${item.vendor} ${item.model}`} onClick={()=>{if(confirm("Удалить запись из каталога?")){setItems(old=>old.filter(x=>x.id!==item.id));setSaved("Есть несохранённые изменения.");}}}><Trash2 size={14}/></button></div></td></tr>)}
 {visible.length===0&&<tr><td colSpan={8} className="catalog-empty">Нет записей по заданному поиску.</td></tr>}
 </tbody></table></div>
 <p className="footnote" role="status">{saved}</p><div className="catalog-legend"><span>Datasheet — есть ссылка на источник</span><span>Шаблон — параметры нужно подтвердить</span></div><div className="warning">Шаблонные параметры не являются паспортными данными конкретной модели. Перед инженерным расчётом проверьте характеристики по документации производителя.</div>
 {draft&&<div className="catalog-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget){setDraft(null);setEditingId(null);}}}><section className="catalog-modal" role="dialog" aria-modal="true" aria-labelledby="catalog-modal-title"><header className="catalog-modal-head"><div><h3 id="catalog-modal-title">{items.some(x=>x.id===editingId)?"Редактирование модели":"Новая модель оборудования"}</h3><p>Заполните параметры и нажмите «Применить».</p></div><button className="icon-btn" aria-label="Закрыть" onClick={()=>{setDraft(null);setEditingId(null);}}><X size={17}/></button></header>
 <div className="catalog-modal-body"><div className="catalog-form-grid"><label>Производитель<input autoFocus value={draft.vendor} onChange={e=>patchDraft({vendor:e.target.value})} placeholder="Производитель"/></label><label>Модель<input value={draft.model} onChange={e=>patchDraft({model:e.target.value})} placeholder="Точное обозначение модели"/></label><label>Категория<select value={draft.category} onChange={e=>patchDraft({category:e.target.value as CatalogItem["category"]})}>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Технология / класс<input value={draft.technology} onChange={e=>patchDraft({technology:e.target.value})} placeholder="Например GPON, класс B+"/></label>
 {fields.map(([key,label])=><label key={key}>{label}<input type="number" step="0.1" value={draft[key]===null||draft[key]===undefined?"":String(draft[key])} onChange={e=>patchDraft({[key]:e.target.value===""?null:Number(e.target.value)} as Partial<CatalogItem>)}/></label>)}
 <label className="catalog-source">Ссылка на datasheet<input type="url" value={draft.sourceUrl} onChange={e=>patchDraft({sourceUrl:e.target.value,dataStatus:e.target.value?"datasheet":"template"})} placeholder="https://..."/>{draft.sourceUrl&&<a href={draft.sourceUrl} target="_blank" rel="noreferrer">Открыть источник</a>}</label><label>Дата проверки<input type="date" value={draft.verifiedAt} onChange={e=>patchDraft({verifiedAt:e.target.value})}/></label><label className="catalog-notes">Примечание<textarea value={draft.notes} onChange={e=>patchDraft({notes:e.target.value})}/></label></div></div>
 <footer className="catalog-modal-footer"><button className="btn" onClick={()=>{setDraft(null);setEditingId(null);}}>Отмена</button><button className="btn primary" onClick={commitDraft}>Применить</button></footer></section></div>}
 </section>;
}
