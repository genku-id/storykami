import sys
import re

with open(r'c:\Pictures\StoryKami\WebSK\src\app\wim\dashboard\buat\editor\page.backup2.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add RepeaterField component
repeater_comp = """
function RepeaterField({ field, items, onChange }) {
  const handleAdd = () => {
    const newItem = {};
    field.sub_fields.forEach(sf => newItem[sf.id] = '');
    onChange([...(items || []), newItem]);
  };

  const handleRemove = (idx) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    onChange(newItems);
  };

  const handleChange = (idx, key, val) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: val };
    onChange(newItems);
  };

  const itemsArr = Array.isArray(items) ? items : [];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'block' }}>{field.label}</label>
      
      {itemsArr.map((item, idx) => (
        <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: 16, background: 'var(--accent)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
            {field.item_title || 'Item'} {idx + 1}
          </div>
          <button type="button" onClick={() => handleRemove(idx)} style={{ position: 'absolute', top: 12, right: 12, background: '#fee2e2', color: '#ef4444', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            {field.sub_fields.map(sf => {
              if (sf.type === 'textarea') {
                 return (
                   <FieldGroup key={sf.id} label={sf.label}>
                     <textarea className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: 60 }} value={item[sf.id] || ''} onChange={e => handleChange(idx, sf.id, e.target.value)} />
                   </FieldGroup>
                 )
              }
              return (
                <FieldGroup key={sf.id} label={sf.label}>
                  <input type={sf.type === 'date' ? 'date' : sf.type === 'time' ? 'time' : 'text'} className="wim-input" style={{ padding: '8px 12px', fontSize: '0.85rem' }} value={item[sf.id] || ''} onChange={e => handleChange(idx, sf.id, e.target.value)} />
                </FieldGroup>
              )
            })}
          </div>
        </div>
      ))}

      <button type="button" onClick={handleAdd} className="btn" style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--accent)', color: 'var(--accent)', width: '100%', padding: '10px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Tambah {field.item_title || 'Item'}
      </button>
    </div>
  );
}

function EditorPage() {"""

content = content.replace("function EditorPage() {", repeater_comp)

# 2. Add Nested properties logic
content = content.replace(
    "setFormData(p => ({ ...p, [f.name]: e.target.value }))",
    """setFormData(p => {
                          const newD = { ...p };
                          const parts = f.id ? f.id.split('.') : f.name.split('.');
                          if (parts.length === 1) newD[parts[0]] = e.target.value;
                          else {
                            newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: e.target.value };
                          }
                          return newD;
                        })"""
)

# Replace values access using f.id (schema.json now uses f.id not f.name for fields)
content = content.replace("formData[f.name]", "f.id?.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id]")
content = content.replace("f.name", "f.id")

# Fix textarea and input map logic to check repeater
map_logic = """
                  if (f.type === 'repeater') {
                    return (
                      <RepeaterField 
                        key={f.id} 
                        field={f} 
                        items={f.id.includes('.') ? formData[f.id.split('.')[0]]?.[f.id.split('.')[1]] : formData[f.id]} 
                        onChange={(val) => {
                          setFormData(p => {
                            const newD = { ...p };
                            const parts = f.id.split('.');
                            if (parts.length === 1) newD[parts[0]] = val;
                            else newD[parts[0]] = { ...newD[parts[0]], [parts[1]]: val };
                            return newD;
                          });
                        }}
                      />
                    );
                  }
                  
                  if (f.type === 'textarea') {"""
                  
content = content.replace("if (f.type === 'textarea') {", map_logic)

# Page logic loading -> init sections
load_data = """setFormData(inv.data || {});"""
load_data_new = """const initialData = inv.data || {};
          if (!initialData.sections) initialData.sections = {};
          setFormData(initialData);"""
content = content.replace(load_data, load_data_new)

# Page Toggle UI inside modal
modal_content_start = """<div style={{ flex: 1, padding: 20, overflowY: 'auto', background: 'var(--bg-secondary)', minHeight: 0 }}>"""
modal_content_new = """<div style={{ flex: 1, padding: 20, overflowY: 'auto', background: 'var(--bg-secondary)', minHeight: 0 }}>
              
              {/* Page Toggle */}
              {activeModalPage.allow_toggle && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>Tampilkan Halaman Ini</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matikan jika Anda tidak ingin menggunakan fitur ini</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: 44, height: 24 }}>
                      <input 
                        type="checkbox" 
                        checked={formData.sections?.[activeModalPage.id] !== false} 
                        onChange={(e) => setFormData(p => ({ ...p, sections: { ...(p.sections || {}), [activeModalPage.id]: e.target.checked } }))} 
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: formData.sections?.[activeModalPage.id] !== false ? 'var(--accent)' : 'var(--border)', borderRadius: 24, transition: '0.4s' }}></span>
                      <span style={{ position: 'absolute', content: '""', height: 18, width: 18, left: formData.sections?.[activeModalPage.id] !== false ? 22 : 4, bottom: 3, background: '#fff', borderRadius: '50%', transition: '0.4s' }}></span>
                    </div>
                  </label>
                </div>
              )}
"""
content = content.replace(modal_content_start, modal_content_new)

# Photos array support instead of single activeModalPage.photo
photo_new = """{activeModalPage.photos && activeModalPage.photos.map(photo => (
                <div key={photo.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={!!usePhotos[photo.name]} 
                      onChange={(e) => setUsePhotos(p => ({ ...p, [photo.name]: e.target.checked }))} 
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    {photo.label}
                  </label>
                  
                  {usePhotos[photo.name] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {getPreviewUrl(photo.name) ? (
                          <>
                            <img src={getPreviewUrl(photo.name)} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => {
                              setImages(p => { const n = {...p}; delete n[photo.name]; return n; });
                              setExistingImages(p => { const n = {...p}; delete n[photo.name]; return n; });
                            }} style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 10 }}>&times;</button>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                        )}
                        {!getPreviewUrl(photo.name) && <input type="file" accept="image/*" name={photo.name} onChange={handleImageChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Akan otomatis dikompres<br/>(Maksimal file ~250KB)
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      {photo.defaultText} akan digunakan.
                    </div>
                  )}
                </div>
              ))}"""
pattern = r'\{activeModalPage\.photo && \([\s\S]*?\{/\* Text Fields \*/\}'
content = re.sub(pattern, photo_new + '\n\n              {/* Text Fields */}', content)

with open(r'c:\Pictures\StoryKami\WebSK\src\app\wim\dashboard\buat\editor\page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modification complete")
