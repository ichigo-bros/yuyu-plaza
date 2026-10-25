'use strict';
// Validate imported data before changing memory or browser storage.
window.SafeData = (() => {
  const blocked = new Set();
  const record = v => !!v && typeof v === 'object' && !Array.isArray(v);
  function requireValue(ok, label) { if (!ok) throw new Error(label + 'の形式が正しくありません'); }
  function text(v, label, optional = false) {
    if (optional && v == null) return '';
    requireValue(typeof v === 'string', label); return v;
  }
  function number(v, label, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false) {
    requireValue(typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isSafeInteger(v)), label); return v;
  }
  function date(v, label, optional = false) {
    if (optional && v === '') return v;
    requireValue(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v), label);
    const d = new Date(v + 'T12:00:00Z');
    requireValue(Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === v, label); return v;
  }
  function list(v, validate, label) { requireValue(Array.isArray(v), label); return v.map(validate); }
  function notice() {
    let el = document.getElementById('data-protection');
    if (!el) { el = document.createElement('div'); el.id='data-protection'; el.setAttribute('role','alert'); el.style.cssText='padding:16px;background:#fff3cd;color:#542b00'; document.body.prepend(el); }
    el.replaceChildren(); el.hidden = blocked.size === 0;
    if (!blocked.size) return;
    el.append('保存データを安全に読み込めませんでした。元のデータは変更していません。退避してから、有効なバックアップを復元してください。');
    const button = document.createElement('button'); button.textContent='元の保存データを退避';
    button.onclick=()=>{const raw={};for(const key of blocked)raw[key]=localStorage.getItem(key);const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(raw)],{type:'application/json'}));a.href=url;a.download='unreadable-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};el.append(button);
  }
  function load(key, fallback, validate) {
    try { const raw=localStorage.getItem(key); return raw === null ? fallback : validate(JSON.parse(raw)); }
    catch { blocked.add(key); notice(); return fallback; }
  }
  function writable() { if(blocked.size) { alert('保存データを保護しています。元のデータを退避し、有効なバックアップを復元してください。'); return false; } return true; }
  function persist(values, restore = false) {
    if(!restore && !writable()) throw new Error('保存データを保護しています');
    const entries=Object.entries(values).map(([key,value])=>[key,JSON.stringify(value),localStorage.getItem(key)]);
    try { for(const [key,value] of entries)localStorage.setItem(key,value); }
    catch(error) { for(const [key,,old] of entries) { try { if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old); }catch{} } throw error; }
    for(const [key] of entries)blocked.delete(key); notice();
  }
  return {record,requireValue,text,number,date,list,load,persist,writable};
})();
