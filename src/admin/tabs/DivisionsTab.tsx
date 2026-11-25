import { ChevronLeft, ChevronRight, Download, Edit2, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { getDivisionLead, getDivisionStructure } from '../../utils/memberQuotaUtils';
import { useAdminPortal } from '../AdminPortalContext';

export default function DivisionsTab() {
  const {
    activeTab,
    activeTenure,
    clearFieldError,
    divPage,
    divRecruitFilter,
    divSearchQuery,
    divTenureFilter,
    divisions,
    expandedDivSubId,
    formErrors,
    handleCreateDivision,
    handleDeleteDivisionClick,
    isDark,
    members,
    newDivDesc,
    newDivFocus,
    newDivName,
    newDivTenureId,
    newSubDivCode,
    newSubDivDivisionId,
    newSubDivName,
    onAddSubDivision,
    onUpdateDivision,
    renderFieldError,
    setDeleteConfirm,
    setDivPage,
    setDivRecruitFilter,
    setDivSearchQuery,
    setDivTenureFilter,
    setEditModalError,
    setEditingItem,
    setExpandedDivSubId,
    setNewDivDesc,
    setNewDivFocus,
    setNewDivName,
    setNewDivTenureId,
    setNewSubDivCode,
    setNewSubDivDivisionId,
    setNewSubDivName,
    setSubDivError,
    showToast,
    subDivError,
    subDivisions,
    tenureRoles,
    tenures
  } = useAdminPortal();

  const DIVS_PER_PAGE = 8;
    const filteredDivs = (divisions || []).filter((d) => {
      const q = divSearchQuery.toLowerCase().trim();
      const lead = getDivisionLead(d, members, tenureRoles);
      const matchesSearch = !q ||
        (d.name || '').toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q) ||
        (lead.name || '').toLowerCase().includes(q) ||
        (Array.isArray(d.focusAreas) && d.focusAreas.some(fa => (fa || '').toLowerCase().includes(q)));
      const matchesTenure = divTenureFilter === 'all' || d.tenureId === divTenureFilter;
      const isRecruiting = Boolean(d.isRecruiting);
      const matchesRecruit = divRecruitFilter === 'all' ||
        (divRecruitFilter === 'open' && isRecruiting) ||
        (divRecruitFilter === 'closed' && !isRecruiting);
      return matchesSearch && matchesTenure && matchesRecruit;
    });
    const totalDivPages = Math.ceil(filteredDivs.length / DIVS_PER_PAGE) || 1;
    const safeDivPage = Math.min(Math.max(1, divPage), totalDivPages);
    const paginatedDivs = filteredDivs.slice(
      (safeDivPage - 1) * DIVS_PER_PAGE,
      safeDivPage * DIVS_PER_PAGE
    );

    return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
          Tambah Divisi / Bidang Baru Dinamis
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Jika ada restrukturisasi organisasi pada periode kepengurusan selanjutnya, tambahkan divisi baru di sini.
        </p>
      </div>

      <form onSubmit={handleCreateDivision} noValidate className="admin-form-two-col" style={{
        background: 'rgba(255,255,255,0.03)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)'
      }}>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Nama Divisi <span style={{ color: '#f43f5e' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Social Impact & Sustainability"
            value={newDivName}
            onChange={(e) => {
              setNewDivName(e.target.value);
              clearFieldError('newDivName');
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${formErrors.newDivName ? '#f43f5e' : 'var(--border-card)'}`,
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          />
          {renderFieldError('newDivName')}
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Periode Kepengurusan *
          </label>
          <select
            value={newDivTenureId || activeTenure?.id || ''}
            onChange={(e) => setNewDivTenureId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          >
            {tenures.map((t) => (
              <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Deskripsi Tugas
          </label>
          <textarea
            rows={2}
            placeholder="Jelaskan peran divisi ini..."
            value={newDivDesc}
            onChange={(e) => setNewDivDesc(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Fokus Program (Pisahkan dengan koma)
          </label>
          <input
            type="text"
            placeholder="Contoh: CSR, Penghijauan, Pilah Sampah"
            value={newDivFocus}
            onChange={(e) => setNewDivFocus(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              padding: '9px 20px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Tambahkan Divisi Baru</span>
          </button>
        </div>
      </form>

      {/* Filter & Search Bar Divisi */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 18px',
        background: 'var(--input-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Cari nama divisi, pimpinan, fokus..."
              value={divSearchQuery}
              onChange={(e) => {
                setDivSearchQuery(e.target.value);
                setDivPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={divTenureFilter}
            onChange={(e) => {
              setDivTenureFilter(e.target.value);
              setDivPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <option value="all">Semua Periode ({divisions.length})</option>
            {tenures.map((t) => (
              <option key={t.id} value={t.id}>
                Periode {t.code || t.title}
              </option>
            ))}
          </select>

          <select
            value={divRecruitFilter}
            onChange={(e) => {
              setDivRecruitFilter(e.target.value);
              setDivPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <option value="all">Semua Status Rekrutmen</option>
            <option value="open">● Rekrutmen Buka</option>
            <option value="closed">○ Rekrutmen Tutup</option>
          </select>
        </div>

        {divisions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
              const header = ['ID Divisi', 'Nama Divisi', 'Periode', 'Pimpinan', 'Fokus Area', 'Status Rekrutmen', 'Warna'].map(escapeCsv).join(',');
              const rows = divisions.map(d => {
                const tObj = tenures.find(t => t.id === d.tenureId);
                const lead = getDivisionLead(d, members, tenureRoles);
                const fa = Array.isArray(d.focusAreas) ? d.focusAreas.join('; ') : (d.focusAreas || '');
                return [d.id, d.name, tObj ? tObj.code || tObj.title : d.tenureId, lead.name || '-', fa, Boolean(d.isRecruiting) ? 'Buka' : 'Tutup', d.color || ''].map(escapeCsv).join(',');
              });
              const csvString = '\uFEFF' + [header, ...rows].join('\n');
              const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `daftar_divisi_bapekkris_${Date.now()}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              showToast('Berhasil mengunduh data divisi ke CSV!');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export CSV Divisi</span>
          </button>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
          Daftar Divisi ({filteredDivs.length} dari {divisions.length}):
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {paginatedDivs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
              Tidak ada divisi yang cocok dengan pencarian "{divSearchQuery}".
            </div>
          ) : (
            paginatedDivs.map((d) => (
            <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `4px solid ${d.color}`
            }}>
              <div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.name}</strong>
                {(() => {
                  const { leaders } = getDivisionStructure(d, members, tenureRoles);
                  if (leaders.length > 0) {
                    return (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                        {leaders.map((l, i) => (
                          <span key={l.id || i} style={{ marginRight: '8px' }}>
                            {l.role}: <strong style={{ color: 'var(--text-main)' }}>{l.name}</strong>
                          </span>
                        ))}
                      </span>
                    );
                  }
                  const lead = getDivisionLead(d, members, tenureRoles);
                  if (lead.name) {
                    return (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>
                        {lead.roleName || 'Pimpinan'}: <strong style={{ color: 'var(--text-main)' }}>{lead.name}</strong>
                      </span>
                    );
                  }
                  return null;
                })()}
                {d.tenureId && (
                  <span className="badge-gold" style={{ fontSize: '0.68rem', marginLeft: '8px', padding: '2px 8px' }}>
                    {tenures.find(t => t.id === d.tenureId)?.code || d.tenureId}
                  </span>
                )}
                {d.updatedAt && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {formatLastUpdatedWib(d.updatedAt)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateDivision) {
                      const nextStatus = !Boolean(d.isRecruiting);
                      onUpdateDivision({ ...d, isRecruiting: nextStatus });
                      showToast(`Status rekrutmen "${d.name}" diubah menjadi: ${nextStatus ? 'Rekrutmen Buka' : 'Rekrutmen Tutup'}`);
                    }
                  }}
                  title="Klik untuk membuka atau menutup status rekrutmen divisi ini di web"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: Boolean(d.isRecruiting) ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)',
                    color: Boolean(d.isRecruiting) ? '#10b981' : 'var(--text-muted)',
                    border: Boolean(d.isRecruiting) ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-card)'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: Boolean(d.isRecruiting) ? '#10b981' : 'var(--text-muted)' }} />
                  <span>{Boolean(d.isRecruiting) ? '● Rekrutmen Buka' : '○ Rekrutmen Tutup'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingItem({
                    type: 'division',
                    item: {
                      ...d,
                      rawFocusAreas: Array.isArray(d.focusAreas) ? d.focusAreas.join(', ') : (d.focusAreas || '')
                    }
                  })}
                  title="Edit Data Divisi"
                  style={{
                    padding: '6px',
                    background: 'rgba(14, 165, 233, 0.1)',
                    border: '1px solid #0284c7',
                    color: '#0284c7',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Edit2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteDivisionClick(d)}
                  title="Hapus Divisi"
                  style={{
                    padding: '6px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid #f43f5e',
                    color: '#f43f5e',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              </div>
            {/* Sub-Divisi Manager Section under this Division */}
            {(() => {
              const currentSubs = subDivisions.filter(sd => sd.divisionId === d.id);
              const isExpanded = expandedDivSubId === d.id;
              return (
                <div style={{
                  marginTop: '4px',
                  marginBottom: '8px',
                  padding: '10px 14px',
                  background: isDark ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  border: isDark ? '1px dashed var(--border-card)' : '1px solid #e2e8f0',
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={14} color="var(--mandiri-gold)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Sub-Divisi ({currentSubs.length})
                      </span>
                      {currentSubs.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {currentSubs.map(s => (
                            <span key={s.id} className="badge-gold" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                              {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedDivSubId(isExpanded ? null : d.id)}
                      style={{
                        fontSize: '0.74rem',
                        color: 'var(--mandiri-gold)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 800
                      }}
                    >
                      {isExpanded ? 'Tutup Kelola Sub-Divisi ▲' : '+ Tambah / Kelola Sub-Divisi ▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-card)' }}>
                      {/* Form Tambah Sub-Divisi */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-start', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: isDark ? 'none' : '1px solid #e2e8f0' }}>
                        <div style={{ flex: '2', minWidth: '160px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Nama Sub-Divisi *</label>
                          <input
                            type="text"
                            placeholder="Contoh: Sie Multimedia / Sie Musik"
                            value={newSubDivDivisionId === d.id ? newSubDivName : ''}
                            onChange={(e) => {
                              setNewSubDivDivisionId(d.id);
                              setNewSubDivName(e.target.value);
                              if (subDivError.divId === d.id) setSubDivError({ divId: null, message: '' });
                            }}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-sm)',
                              background: isDark ? 'var(--input-bg)' : '#ffffff',
                              border: `1px solid ${subDivError.divId === d.id && subDivError.message ? '#f43f5e' : (isDark ? 'var(--border-card)' : '#cbd5e1')}`,
                              color: 'var(--text-main)',
                              fontSize: '0.8rem'
                            }}
                          />
                          {subDivError.divId === d.id && subDivError.message && (
                            <span style={{ color: '#f43f5e', fontSize: '0.72rem', display: 'block', marginTop: '3px', fontWeight: 600 }}>
                              {subDivError.message}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: '1', minWidth: '100px' }}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Kode Singkat</label>
                          <input
                            type="text"
                            placeholder="Contoh: MULTI"
                            value={newSubDivDivisionId === d.id ? newSubDivCode : ''}
                            onChange={(e) => {
                              setNewSubDivDivisionId(d.id);
                              setNewSubDivCode(e.target.value);
                            }}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: isDark ? 'var(--input-bg)' : '#ffffff', border: isDark ? '1px solid var(--border-card)' : '1px solid #cbd5e1', color: 'var(--text-main)', fontSize: '0.8rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const cleanName = (newSubDivDivisionId === d.id ? newSubDivName : '').trim();
                            const cleanCode = (newSubDivDivisionId === d.id ? newSubDivCode : '').trim().toUpperCase();

                            if (!cleanName) {
                              setSubDivError({ divId: d.id, message: 'Nama sub-divisi wajib diisi.' });
                              showToast('Nama Sub-Divisi wajib diisi', 'error');
                              return;
                            }

                            const isDup = currentSubs.some(s => s.name.trim().toLowerCase() === cleanName.toLowerCase());
                            if (isDup) {
                              setSubDivError({ divId: d.id, message: `Sub-divisi "${cleanName}" sudah terdaftar pada divisi ini.` });
                              showToast(`Sub-divisi "${cleanName}" sudah terdaftar pada divisi ini!`, 'error');
                              return;
                            }

                            setSubDivError({ divId: null, message: '' });
                            if (onAddSubDivision) {
                              onAddSubDivision({
                                id: 'subdiv-' + Date.now(),
                                divisionId: d.id,
                                name: cleanName,
                                code: cleanCode || undefined,
                                description: '',
                                sortOrder: currentSubs.length
                              });
                              setNewSubDivName('');
                              setNewSubDivCode('');
                              showToast(`Sub-divisi "${cleanName}" berhasil ditambahkan ke divisi ${d.name}!`);
                            }
                          }}
                          style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--mandiri-gold)', color: '#040914', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', height: '32px', marginTop: '18px' }}
                        >
                          + Simpan
                        </button>
                      </div>

                      {/* Daftar Sub-Divisi */}
                      {currentSubs.length === 0 ? (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '6px 0' }}>
                          Belum ada sub-divisi di bawah divisi ini.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {currentSubs.map((sd) => {
                            const assignedMemCount = (members || []).filter(m => m.subDivisionId === sd.id).length;
                            return (
                              <div key={sd.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '6px', border: isDark ? 'none' : '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{sd.name}</span>
                                  {sd.code && <span className="badge-gold" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{sd.code}</span>}
                                  {assignedMemCount > 0 && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', padding: '1px 6px', borderRadius: '4px' }}>
                                      {assignedMemCount} Anggota
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {/* Tombol Edit Sub-Divisi */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditModalError('');
                                      setEditingItem({
                                        type: 'sub_division',
                                        item: { ...sd }
                                      });
                                    }}
                                    title="Edit Sub-Divisi"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(255, 184, 0, 0.12)',
                                      border: '1px solid rgba(255, 184, 0, 0.35)',
                                      color: 'var(--mandiri-gold)',
                                      cursor: 'pointer',
                                      fontSize: '0.72rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit</span>
                                  </button>

                                  {/* Tombol Hapus Sub-Divisi (Modal Custom) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteConfirm({
                                        type: 'sub_division',
                                        id: sd.id,
                                        name: sd.name,
                                        divName: d.name,
                                        memCount: assignedMemCount,
                                        isBlocked: assignedMemCount > 0
                                      });
                                    }}
                                    title="Hapus Sub-Divisi"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      background: 'rgba(244, 63, 94, 0.12)',
                                      border: '1px solid rgba(244, 63, 94, 0.35)',
                                      color: '#f43f5e',
                                      cursor: 'pointer',
                                      fontSize: '0.72rem',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Trash2 size={12} />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
          )))}
        </div>
      </div>

      {/* Pagination Controls Divisi */}
      {totalDivPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-card)'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menampilkan <strong>{(safeDivPage - 1) * DIVS_PER_PAGE + 1} - {Math.min(safeDivPage * DIVS_PER_PAGE, filteredDivs.length)}</strong> dari <strong>{filteredDivs.length}</strong> divisi
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={safeDivPage === 1}
              onClick={() => setDivPage((p: any) => Math.max(1, p - 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: safeDivPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: safeDivPage === 1 ? 'not-allowed' : 'pointer',
                opacity: safeDivPage === 1 ? 0.45 : 1
              }}
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>
            {Array.from({ length: totalDivPages }, (_, idx) => idx + 1).map((pg) => {
              const isActive = pg === safeDivPage;
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setDivPage(pg)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                    color: isActive ? '#040914' : 'var(--text-main)',
                    border: isActive ? 'none' : '1px solid var(--border-card)',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {pg}
                </button>
              );
            })}
            <button
              type="button"
              disabled={safeDivPage === totalDivPages}
              onClick={() => setDivPage((p: any) => Math.min(totalDivPages, p + 1))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: safeDivPage === totalDivPages ? 'var(--text-dim)' : 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: safeDivPage === totalDivPages ? 'not-allowed' : 'pointer',
                opacity: safeDivPage === totalDivPages ? 0.45 : 1
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
