import React,{useMemo,useState} from "react";
import {Download,Plus,Save,Trash2} from "lucide-react";
import {CatalogItem,STARTER_CATALOG} from "./catalog";
import "./catalog.css";
const KEY="optibudget.catalog.v1";
const read=():CatalogItem[]=>{try{const raw=localStorage.getItem(KEY);if(raw)return JSON.parse(raw) as CatalogItem[]}catch{}return STARTER_CATALOG.map(x=>({...x}))};
const categories:CatalogItem["category"][]=["OLT","ONT/ONU","PLC","FBT","Optical module","Fiber"];
const fields:[keyof CatalogItem,string][]=[["txMinDbm","TX min, dBm"],["txMaxDbm","TX max, dBm"],["rxSensitivityDbm","RX чувствительность, dBm"],["rxOverloadDbm","RX перегрузка, dBm"],["insertionLossDb","Insertion loss, dB"]];
export default function CatalogManager(){
 const [items,setItems]=useState<CatalogItem[]>(read);
 const [filter,setFilter]=useState("");
 const [saved,setSaved]=useState("Изменения хранятся локально до сохранения.");
 const visible=useMemo(()=>items.filter(x=>[x.vendor,x.model,x.category,x.technology].join(" ").toLowerCase().includes(filter.toLowerCase())),[items,filter]);
 function update(id:string,patch:Partial<CatalogItem>){setItems(old=>old.map(x=>x.id===id?{...x,...patch}:x));setSaved("Есть несохранённые изменения.");}
 function save(){localStorage.setItem(KEY,JSON.stringify(items));setSaved("Каталог сохранён в этом браузере.");}
 function add(){const id=globalThis.crypto?.randomUUID?.()??`catalog-${Date.now()}`;setItems(old=>[{id,vendor:"Новый производитель",model:"",category:"ONT/ONU",technology:"",txMinDbm:null,txMaxDbm:null,rxSensitivityDbm:null,rxOverloadDbm:null,insertionLossDb:null,sourceUrl:"",verifiedAt:"",notes:"Укажите точную модель и подтвердите параметры по официальному datasheet."},...old]);setSaved("Есть несохранённые изменения.");}
 function exportData(){const blob=new Blob([JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),items},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="optibudget-equipment-catalog.json";a.click();URL.revokeObjectURL(url);}
 return <section className="panel catalog-manager"><div className="panel-heading"><div><h2>Каталог оборудования и компонентов</h2><p>Добавляйте точные модели и параметры из официальных datasheet. Пустые поля означают, что характеристика не подтверждена.</p></div><div className="catalog-actions"><button className="btn" onClick={add}><Plus size={14}/> Добавить модель</button><button className="btn" onClick={exportData}><Download size={14}/> JSON</button><button className="btn primary" onClick={save}><Save size={14}/> Сохранить</button></div></div>
 <div className="catalog-filter"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Поиск по производителю, модели, типу или технологии"/><span>{visible.length} из {items.length}</span></div>
 <div className="catalog-records">{visible.map(item=><article className="catalog-record" key={item.id}><div className="catalog-record-top"><div><strong>{item.vendor||"Без производителя"} {item.model}</strong><small>{item.id}</small></div><button className="icon-btn" aria-label="Удалить запись каталога" onClick={()=>{setItems(old=>old.filter(x=>x.id!==item.id));setSaved("Есть несохранённые изменения.");}}><Trash2 size={14}/></button></div>
 <div className="catalog-form-grid"><label>Производитель<input value={item.vendor} onChange={e=>update(item.id,{vendor:e.target.value})}/></label><label>Модель<input value={item.model} onChange={e=>update(item.id,{model:e.target.value})} placeholder="Точное обозначение модели"/></label><label>Категория<select value={item.category} onChange={e=>update(item.id,{category:e.target.value as CatalogItem["category"]})}>{categories.map(x=><option key={x}>{x}</option>)}</select></label><label>Технология / класс<input value={item.technology} onChange={e=>update(item.id,{technology:e.target.value})} placeholder="Например GPON, класс B+"/></label>
 {fields.map(([key,label])=><label key={key}>{label}<input type="number" step="0.1" value={item[key]===null?"":String(item[key])} onChange={e=>update(item.id,{[key]:e.target.value===""?null:Number(e.target.value)} as Partial<CatalogItem>)}/></label>)}
 <label className="catalog-source">Ссылка на datasheet<input type="url" value={item.sourceUrl} onChange={e=>update(item.id,{sourceUrl:e.target.value})} placeholder="https://..."/></label><label>Дата проверки<input type="date" value={item.verifiedAt} onChange={e=>update(item.id,{verifiedAt:e.target.value})}/></label><label className="catalog-notes">Примечание<textarea value={item.notes} onChange={e=>update(item.id,{notes:e.target.value})}/></label></div></article>)}</div>
 <p className="footnote" role="status">{saved}</p><div className="warning">Параметры стартового каталога намеренно не заполнены вымышленными паспортными данными. Для инженерного расчёта используйте точную модель, официальный источник, класс оптики, длину волны и условия измерений.</div>
 </section>;
}
