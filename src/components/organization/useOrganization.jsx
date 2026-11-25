import { useState, useEffect } from 'react';
import { soundFx } from '../../utils/audio';
import { getTenureRoles, getMemberLevel, findMatchingRole } from '../../utils/memberQuotaUtils';

export function formatWaNumber(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

/** Tenure selection, hierarchy levels, directory filters and contact actions of the org page. */
export function useOrganization({
  activeTenure,
  tenures = [],
  divisions = [],
  subDivisions = [],
  members = [],
  events = [],
  roleQuotas = {},
  tenureRoles = [],
  isEventPageVisible = true,
  onNavigateProgram,
  theme,
  onSelectTenure
}) {
  const isDark = theme ? theme === 'dark' : (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') !== 'light' : true);
  const [selectedTenureId, setSelectedTenureId] = useState(activeTenure?.id || tenures[0]?.id || '');
  const [selectedMember, setSelectedMember] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [subDivisionFilter, setSubDivisionFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Sync selectedTenureId whenever activeTenure from navbar/parent changes
  useEffect(() => {
    if (activeTenure?.id) {
      setSelectedTenureId(activeTenure.id);
    }
  }, [activeTenure?.id]);

  // Reset search and filters whenever selected tenure changes
  useEffect(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setDivisionFilter('all');
    setSubDivisionFilter('all');
  }, [selectedTenureId]);

  const currentTenure = tenures.find(t => t.id === selectedTenureId) || activeTenure || tenures[0] || null;
  const currentTenureId = currentTenure?.id || activeTenure?.id || '';

  const handleExportPdf = async () => {
    soundFx.playClick();
    setIsExporting(true);
    try {
      // PDF libraries (~600 KB) are loaded only when an export is requested
      const { exportPresentationToPdf } = await import('../../utils/exportPdf');
      await exportPresentationToPdf('org-tree-export-container', null, currentTenure || activeTenure);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVCard = (member) => {
    if (!member) return;
    const phone = formatWaNumber(member.whatsapp || '');
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${member.name || ''}`,
      'ORG:Bank Mandiri - Bapekkris (Badan Pembinaan Kerohanian Kristen)',
      `TITLE:${member.role || ''}`,
      phone ? `TEL;TYPE=CELL,VOICE:+${phone}` : '',
      `NOTE:${member.motto || ''}`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcardLines], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = String(member.name || 'bapekkris').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `kontak-${safeName}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleCopyPhone = (rawPhone) => {
    if (!rawPhone) return;
    try {
      navigator.clipboard.writeText(rawPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2200);
    } catch (e) {}
  };

  const activeDivisions = (divisions || []).filter(d => !currentTenureId || d.tenureId === currentTenureId);
  const activeMembers = (members || []).filter(m => !currentTenureId || m.tenureId === currentTenureId);

  const currentTenureRoles = getTenureRoles(currentTenureId, roleQuotas, tenureRoles);

  // Dewan Penasehat (Level 0 - Tingkat tertinggi bila ada)
  const penasehats = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 0);

  // Pembina (Level 1)
  const pembinas = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 1);

  // Level 2: Pimpinan Tingkat 2 (Ketua / Wakil Ketua) - Diurutkan berdasarkan sort_order DB
  const level2Members = activeMembers.filter(m => getMemberLevel(m, currentTenureRoles) === 2);
  const displayLevel2 = [...level2Members].sort((a, b) => {
    const roleA = findMatchingRole(a, currentTenureRoles);
    const roleB = findMatchingRole(b, currentTenureRoles);
    const sortA = roleA ? Number(roleA.sortOrder ?? 0) : 0;
    const sortB = roleB ? Number(roleB.sortOrder ?? 0) : 0;
    if (sortA !== sortB) return sortA - sortB;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  // Level 3: Pengurus Harian / BPH (Non-Divisi) - Diurutkan berdasarkan sort_order DB
  const displayLevel3 = activeMembers.filter(m => {
    const isLevel3 = getMemberLevel(m, currentTenureRoles) === 3;
    const roleObj = findMatchingRole(m, currentTenureRoles);
    const belongsToDivision = Boolean(m.divisionId || roleObj?.requiresDivision);
    return isLevel3 && !belongsToDivision;
  }).sort((a, b) => {
    const roleA = findMatchingRole(a, currentTenureRoles);
    const roleB = findMatchingRole(b, currentTenureRoles);
    const sortA = roleA ? Number(roleA.sortOrder ?? 0) : 0;
    const sortB = roleB ? Number(roleB.sortOrder ?? 0) : 0;
    if (sortA !== sortB) return sortA - sortB;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const isFiltering = searchQuery.trim() !== '' || roleFilter !== 'all' || divisionFilter !== 'all' || subDivisionFilter !== 'all';

  const filteredDirectoryMembers = activeMembers.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.title || '').toLowerCase().includes(q) ||
      (Array.isArray(m.responsibilities) && m.responsibilities.some(r => r.toLowerCase().includes(q)));
    
    const memberRole = findMatchingRole(m, currentTenureRoles);
    const matchesRole = roleFilter === 'all' ||
      m.roleId === roleFilter ||
      memberRole?.id === roleFilter ||
      (memberRole?.name && memberRole.name.toLowerCase() === roleFilter.toLowerCase());

    const matchesDiv = divisionFilter === 'all' || m.divisionId === divisionFilter;
    const matchesSubDiv = subDivisionFilter === 'all' || m.subDivisionId === subDivisionFilter;
    return matchesSearch && matchesRole && matchesDiv && matchesSubDiv;
  });

  const handleMemberClick = (member) => {
    soundFx.playClick();
    setSelectedMember(member);
  };

  const handleCloseModal = () => {
    soundFx.playClick();
    setSelectedMember(null);
  };

  return {
    activeTenure,
    tenures,
    divisions,
    subDivisions,
    events,
    isEventPageVisible,
    onNavigateProgram,
    onSelectTenure,
    selectedTenureId,
    setSelectedTenureId,
    selectedMember,
    setSelectedMember,
    copiedPhone,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    divisionFilter,
    setDivisionFilter,
    subDivisionFilter,
    setSubDivisionFilter,
    isExporting,
    currentTenure,
    currentTenureId,
    handleExportPdf,
    handleDownloadVCard,
    handleCopyPhone,
    activeDivisions,
    activeMembers,
    currentTenureRoles,
    penasehats,
    pembinas,
    displayLevel2,
    displayLevel3,
    isFiltering,
    filteredDirectoryMembers,
    handleMemberClick,
    handleCloseModal
  };
}
