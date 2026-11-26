import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { formatWibTimestamp, getDeadlineStatus } from '../../utils/dateUtils';
import { generateFormQrPoster } from '../../utils/qrPosterGenerator';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { useAppNavigate } from '../../lib/appNavigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppItem } from '../../lib/supabase';
import type { FormField } from '../../types/content';
import { getFormFields } from '../../utils/formMeta';
import { DIAGRAM_COLORS } from './constants';
import { downloadCsv } from '../../utils/csv';
import { fieldValue, participantInfo, participantName, winnerNameFrom, type SubmissionData } from '../../utils/participantInfo';

export interface UseEventRegistrationStatsProps {
  eventId: string | null;
  events?: AppItem[];
  forms?: AppItem[];
  submissions?: AppItem[];
  eventRsvps?: AppItem[];
  luckyDraws?: AppItem[];
  onAddLuckyDraw?: (draws: AppItem[]) => void;
  onDeleteLuckyDraw?: (drawId: string) => void;
  onResetLuckyDraw?: (eventId: string) => void;
  onBack?: () => void;
  onNavigateForm?: (formId: string) => void;
}

export type RegistrationStatsState = ReturnType<typeof useEventRegistrationStats>;

type PageSize = number | 'all';
interface SortConfig { key: string; direction: 'asc' | 'desc' }
interface DiagramItem { label: string; count: number; percentage: number; color: string }
interface DrawCandidate { id: string; submissionId: string; name: string; department: string; identifier: string; source: string; raw: AppItem }

const CHOICE_TYPES = ['select', 'radio', 'dropdown', 'choice'];
const optionText = (opt: unknown) => (opt && typeof opt === 'object'
  ? String((opt as { value?: string; label?: string }).value || (opt as { label?: string }).label || '')
  : String(opt ?? '')).trim();
const slug = (title?: string) => (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'event');

/** State, data and handlers of EventRegistrationStats; the markup lives in EventRegistrationStats.tsx and ./sections. */
export function useEventRegistrationStats({
  eventId,
  events = [],
  forms = [],
  submissions = [],
  eventRsvps = [],
  luckyDraws = [],
  onAddLuckyDraw,
  onDeleteLuckyDraw,
  onResetLuckyDraw,
  onBack,
  onNavigateForm
}: UseEventRegistrationStatsProps) {
  const navigateTo = useAppNavigate();

  // 1. Target Event & Connected Form
  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const connectedForm = useMemo<AppItem | null>(() => {
    if (!eventId) return null;
    return forms.find(f => f.isEventConnected && f.eventId === eventId) ||
      forms.find(f => f.eventId === eventId) || null;
  }, [forms, eventId]);
  const formFields = useMemo(() => getFormFields(connectedForm), [connectedForm]);

  const isLuckyDrawEnabled = connectedForm ? Boolean(connectedForm.isLuckyDraw) : false;

  const isFormClosed = useMemo(() => {
    if (!connectedForm) return false;
    if (connectedForm.isOpen === false || Boolean(connectedForm.isClosed)) return true;
    if (connectedForm.deadline && getDeadlineStatus(connectedForm.deadline).isExpired) return true;
    return false;
  }, [connectedForm]);

  // View state: 'stats' | 'checkin' | 'luckydraw'
  const [activeView, setActiveView] = useState<'stats' | 'checkin' | 'luckydraw'>('stats');

  // Submissions strictly from the connected form
  const formSubmissions = useMemo(() => {
    if (!connectedForm) return [];
    return submissions.filter(s => String(s.formId) === String(connectedForm.id));
  }, [submissions, connectedForm]);

  // Realtime Welcome Alert Queue state
  const seenSubIdsRef = useRef(new Set<string>());
  const isFirstLoadRef = useRef(true);
  const [welcomeQueue, setWelcomeQueue] = useState<{ id: string; name: string }[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ id: string; name: string } | null>(null);

  // Participant name for the welcome alert and the check-in list
  const extractParticipantName = useCallback(
    (sub: AppItem | null) => participantName(sub?.data, formFields) || 'Peserta Baru',
    [formFields]
  );

  // Realtime submission detector
  useEffect(() => {
    if (!formSubmissions || formSubmissions.length === 0) {
      return;
    }

    // First mount: seed existing submissions so they don't flood alerts
    if (isFirstLoadRef.current) {
      formSubmissions.forEach(s => {
        if (s.id) seenSubIdsRef.current.add(String(s.id));
      });
      isFirstLoadRef.current = false;
      return;
    }

    // Detect truly newly arrived submissions
    const newItems = formSubmissions.filter(s => s.id && !seenSubIdsRef.current.has(String(s.id)));
    if (newItems.length > 0) {
      newItems.forEach(s => seenSubIdsRef.current.add(String(s.id)));

      // Sort chronological FIFO (earlier submission first)
      const sortedNew = [...newItems].sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tA - tB;
      });

      const alertsToAdd = sortedNew.map(s => ({
        id: s.id || `alert-${Date.now()}-${Math.random()}`,
        name: extractParticipantName(s)
      }));

      setWelcomeQueue(prev => [...prev, ...alertsToAdd]);
    }
  }, [formSubmissions, extractParticipantName]);

  // FIFO Queue Consumer: display alerts one by one, no piling up
  useEffect(() => {
    if (activeAlert) return;
    if (welcomeQueue.length === 0) return;

    const nextAlert = welcomeQueue[0];
    setActiveAlert(nextAlert);
    setWelcomeQueue(prev => prev.slice(1));
  }, [activeAlert, welcomeQueue]);

  // Auto-dismiss active alert after 3.8 seconds
  useEffect(() => {
    if (!activeAlert) return;

    const timer = setTimeout(() => {
      setActiveAlert(null);
    }, 3800);

    return () => clearTimeout(timer);
  }, [activeAlert]);

  // Initial event RSVPs (preserved in DB/state, but NOT counted into stats or draw while form is connected)
  const initialRsvps = useMemo(() => {
    if (!eventId) return [];
    return eventRsvps.filter(r => String(r.eventId) === String(eventId));
  }, [eventRsvps, eventId]);

  // Authoritative Quota & Limits:
  // When form is connected, follow form's limits. When not connected, follow event's limits.
  const effectiveIsLimited = connectedForm ? Boolean(connectedForm.isLimited) : Boolean(event?.isLimited);
  const effectiveMaxQuota = connectedForm ? Number(connectedForm.maxQuota || 0) : Number(event?.maxQuota || 0);
  const totalPendaftar = connectedForm ? formSubmissions.length : initialRsvps.length;

  const participationRate = useMemo(() => {
    if (!effectiveIsLimited || effectiveMaxQuota <= 0) return 0;
    return Math.min(100, Math.round((totalPendaftar / effectiveMaxQuota) * 100));
  }, [effectiveIsLimited, effectiveMaxQuota, totalPendaftar]);

  // QR Code Generation
  const directFormUrl = useMemo(() => {
    if (!connectedForm) return '';
    return `${getPublicBaseUrl()}/?tab=form&formId=${encodeURIComponent(connectedForm.id)}`;
  }, [connectedForm]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!directFormUrl) {
      setQrCodeDataUrl('');
      return;
    }
    QRCode.toDataURL(directFormUrl, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#030814',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [directFormUrl]);

  const handleCopyLink = async () => {
    if (!directFormUrl) return;
    try {
      await navigator.clipboard.writeText(directFormUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  // Poster modal state
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterModal, setPosterModal] = useState<Awaited<ReturnType<typeof generateFormQrPoster>> | null>(null);

  const handleGeneratePoster = async () => {
    if (!connectedForm) return;
    setIsGeneratingPoster(true);
    try {
      const result = await generateFormQrPoster({
        form: connectedForm,
        event: event,
        baseUrl: getPublicBaseUrl()
      });

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (typeof navigator !== 'undefined' && navigator.canShare && result.blob) {
        try {
          const file = new File([result.blob], result.fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Poster QR: ${connectedForm.title}`,
              text: `Pendaftaran Acara ${event?.title || ''} via Formulir Bapekkris Bank Mandiri`
            });
            setIsGeneratingPoster(false);
            return;
          }
        } catch (shareErr) {
          if ((shareErr as Error)?.name === 'AbortError') {
            setIsGeneratingPoster(false);
            return;
          }
        }
      }

      if (isMobile) {
        setPosterModal(result);
        setIsGeneratingPoster(false);
        return;
      }

      if (!result.blob) throw new Error('Poster PNG gagal dibuat');
      const blobUrl = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (err) {
      console.error('Error generating QR poster:', err);
    }
    setIsGeneratingPoster(false);
  };

  // =========================================================================
  // DYNAMIC DIAGRAM LOGIC (Choice / Dropdown Fields)
  // =========================================================================
  const choiceFields = useMemo(
    () => formFields.filter(f => CHOICE_TYPES.includes((f.type || '').toLowerCase()) || Array.isArray(f.options)),
    [formFields]
  );

  const [activeDiagramFieldId, setActiveDiagramFieldId] = useState('');

  // Default to first choice field when available
  useEffect(() => {
    if (choiceFields.length > 0) {
      if (!activeDiagramFieldId || !choiceFields.some(f => f.id === activeDiagramFieldId)) {
        setActiveDiagramFieldId(choiceFields[0].id);
      }
    } else {
      setActiveDiagramFieldId('');
    }
  }, [choiceFields, activeDiagramFieldId]);

  const activeChoiceField = useMemo<FormField | null>(() => {
    if (!activeDiagramFieldId) return choiceFields[0] || null;
    return choiceFields.find(f => f.id === activeDiagramFieldId) || choiceFields[0] || null;
  }, [activeDiagramFieldId, choiceFields]);

  // Compute breakdown for the active choice field
  const diagramData = useMemo(() => {
    if (!activeChoiceField) {
      // Fallback: Status breakdown
      const statusMap: Record<string, number> = { 'Accepted': 0, 'Submitted': 0, 'Rejected': 0 };
      formSubmissions.forEach(s => {
        const st = s.status || 'Submitted';
        statusMap[st] = (statusMap[st] || 0) + 1;
      });
      const total = formSubmissions.length;
      const items: DiagramItem[] = Object.entries(statusMap).map(([opt, count], idx) => ({
        label: opt === 'Accepted' ? 'Diterima' : (opt === 'Submitted' ? 'Menunggu Review' : 'Ditolak'),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: DIAGRAM_COLORS[idx % DIAGRAM_COLORS.length]
      }));
      return {
        fieldLabel: 'Status Pendaftaran',
        items,
        totalAnswered: total,
        filledCount: items.filter(i => i.count > 0).length,
        totalCategories: items.length
      };
    }

    const fLabel = activeChoiceField.label || 'Pilihan';
    const answersMap: Record<string, number> = {};
    let totalAnswered = 0;

    // Pre-defined options start at zero so unanswered choices still show
    (activeChoiceField.options || []).map(optionText).filter(Boolean).forEach(opt => {
      answersMap[opt] = 0;
    });

    // Tally submission responses
    formSubmissions.forEach(sub => {
      const val = fieldValue(sub.data, activeChoiceField) ?? '';
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        totalAnswered += 1;
        const ansKey = String(val).trim();
        answersMap[ansKey] = (answersMap[ansKey] || 0) + 1;
      }
    });

    const items: DiagramItem[] = Object.entries(answersMap).map(([opt, count], idx) => ({
      label: opt,
      count,
      percentage: totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0,
      color: DIAGRAM_COLORS[idx % DIAGRAM_COLORS.length]
    })).sort((a, b) => b.count - a.count);

    return {
      fieldLabel: fLabel,
      items,
      totalAnswered,
      filledCount: items.filter(i => i.count > 0).length,
      totalCategories: items.length
    };
  }, [activeChoiceField, formSubmissions]);

  // =========================================================================
  // TABLE FILTERING, DYNAMIC MULTI-FILTER, SORTING & PAGINATION
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownFilters, setDropdownFilters] = useState<Record<string, string>>({});
  const [winnerFilter, setWinnerFilter] = useState('ALL');

  // Extract distinct available options for any dropdown field
  const getDropdownOptions = useCallback((df: FormField) => {
    const opts = new Set<string>((df.options || []).map(optionText).filter(Boolean));
    // Also include any value that appears in the submissions data
    formSubmissions.forEach(sub => {
      const val = fieldValue(sub.data, df);
      if (val !== undefined && val !== null && String(val).trim()) {
        opts.add(String(val).trim());
      }
    });
    return Array.from(opts);
  }, [formSubmissions]);

  // Dynamic search placeholder based on form fields
  const searchPlaceholder = useMemo(() => {
    if (formFields.length > 0) return `Cari ${formFields.slice(0, 3).map(f => f.label).join(', ')}...`;
    return 'Cari data pendaftar...';
  }, [formFields]);

  // Multi-sorting: { key, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  // Lucky draw winners of this event, with the name resolved from the submission when missing
  const eventWinners = useMemo(() => {
    if (!eventId) return [];
    return luckyDraws.filter(ld => ld.eventId === eventId).map((ld): AppItem => {
      const sub = formSubmissions.find(s => s.id === ld.submissionId) || null;
      const subData: SubmissionData = ld.submissionData || sub?.data || {};
      const resolvedName = ld.winnerName || (sub ? winnerNameFrom(subData, formFields) : '');
      return { ...ld, winnerName: resolvedName || 'Peserta', submissionData: subData, rawSubmission: sub };
    });
  }, [luckyDraws, eventId, formSubmissions, formFields]);

  const getWinnerDisplayName = (w: AppItem | null) => {
    if (!w) return 'Peserta';
    if (w.winnerName && w.winnerName !== 'Peserta') return w.winnerName;
    const sub = formSubmissions.find(s => s.id === w.submissionId);
    return (sub && winnerNameFrom(w.submissionData || sub.data, formFields)) || w.winnerName || 'Peserta';
  };

  const wonIdsSet = useMemo(() => {
    const s = new Set<string>();
    eventWinners.forEach(w => {
      if (w.submissionId) s.add(w.submissionId);
      if (w.winnerName) s.add(w.winnerName.toLowerCase().trim());
      if (w.winnerIdentifier) s.add(w.winnerIdentifier.toLowerCase().trim());
    });
    return s;
  }, [eventWinners]);

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...formSubmissions];

    // 1. Global Search (Dynamic across all form submission field values)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(sub => {
        const dataValues = Object.entries(sub.data || {}).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase();
        return dataValues.includes(q) || String(sub.createdAt || '').toLowerCase().includes(q);
      });
    }

    // 2. Dynamic Dropdown Filters
    Object.entries(dropdownFilters).forEach(([fieldId, selectedVal]) => {
      if (selectedVal && selectedVal !== 'ALL') {
        const field = formFields.find(f => f.id === fieldId) || { id: fieldId, label: fieldId };
        result = result.filter(sub => String(fieldValue(sub.data, field) ?? '').trim() === selectedVal);
      }
    });

    // 3. Winner Status Filter (only if Lucky Draw is enabled)
    if (isLuckyDrawEnabled) {
      if (winnerFilter === 'WINNERS') {
        result = result.filter(sub => wonIdsSet.has(sub.id));
      } else if (winnerFilter === 'NOT_WINNERS') {
        result = result.filter(sub => !wonIdsSet.has(sub.id));
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA: number | string, valB: number | string;
      if (sortConfig.key === 'createdAt') {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        const field = formFields.find(f => f.id === sortConfig.key || f.label === sortConfig.key) || { id: sortConfig.key, label: sortConfig.key };
        valA = String(fieldValue(a.data, field) ?? '').toLowerCase();
        valB = String(fieldValue(b.data, field) ?? '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [formSubmissions, searchQuery, dropdownFilters, winnerFilter, isLuckyDrawEnabled, sortConfig, formFields, wonIdsSet]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dropdownFilters, winnerFilter, pageSize]);

  // Paginated Rows
  const totalFiltered = filteredSubmissions.length;
  const paginatedSubmissions = useMemo(() => {
    if (pageSize === 'all') return filteredSubmissions;
    const start = (currentPage - 1) * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, currentPage, pageSize]);

  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  const handleHeaderSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: 'createdAt', direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim() !== '') return true;
    if (isLuckyDrawEnabled && winnerFilter !== 'ALL') return true;
    for (const val of Object.values(dropdownFilters)) {
      if (val && val !== 'ALL') return true;
    }
    return false;
  }, [searchQuery, winnerFilter, dropdownFilters, isLuckyDrawEnabled]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDropdownFilters({});
    setWinnerFilter('ALL');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  // Export Table Data to CSV (100% dynamic based on actual form fields)
  const handleExportCsv = () => {
    if (formSubmissions.length === 0) return;
    const fieldHeaders = formFields.map(f => f.label || 'Field');
    const allHeaders = [
      'No',
      ...fieldHeaders,
      ...(isLuckyDrawEnabled ? ['Status Undian'] : []),
      'Waktu Pendaftaran'
    ];

    const rows = filteredSubmissions.map((sub, idx) => {
      const isWinner = wonIdsSet.has(sub.id) ? 'Pemenang Undian' : 'Belum Menang';
      const formattedDate = formatWibTimestamp(sub.createdAt).shortDate || sub.createdAt || '-';
      return [idx + 1, ...formFields.map(f => fieldValue(sub.data, f) ?? ''), ...(isLuckyDrawEnabled ? [isWinner] : []), formattedDate];
    });

    downloadCsv(`pendaftar-${slug(event?.title)}.csv`, allHeaders, rows);
  };

  // =========================================================================
  // LUCKY DRAW WINNERS TABLE CONTROLS (SEARCH, FILTER, SORT, PAGINATION, CSV)
  // =========================================================================
  const [winnerSearchQuery, setWinnerSearchQuery] = useState('');
  const [winnerPrizeFilter, setWinnerPrizeFilter] = useState('ALL');
  const [winnerDropdownFilters, setWinnerDropdownFilters] = useState<Record<string, string>>({});
  const [winnerSortConfig, setWinnerSortConfig] = useState<SortConfig>({ key: 'drawNumber', direction: 'asc' });
  const [winnerCurrentPage, setWinnerCurrentPage] = useState(1);
  const [winnerPageSize, setWinnerPageSize] = useState<PageSize>(10);

  // Dynamic search placeholder for winners
  const winnerSearchPlaceholder = useMemo(() => {
    if (formFields.length > 0) return `Cari pemenang, ${formFields.slice(0, 2).map(f => f.label).join(', ')}, hadiah...`;
    return 'Cari nama, hadiah, atau data pemenang...';
  }, [formFields]);

  // Unique list of prize names among winners
  const uniquePrizeNames = useMemo(() => {
    const set = new Set<string>();
    eventWinners.forEach(w => {
      const p = w.prizeName;
      if (p && p.trim()) set.add(p.trim());
    });
    return Array.from(set);
  }, [eventWinners]);

  const hasActiveWinnerFilters = useMemo(() => {
    if (winnerSearchQuery.trim()) return true;
    if (winnerPrizeFilter !== 'ALL') return true;
    for (const val of Object.values(winnerDropdownFilters)) {
      if (val && val !== 'ALL') return true;
    }
    return false;
  }, [winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters]);

  const handleResetWinnerFilters = () => {
    setWinnerSearchQuery('');
    setWinnerPrizeFilter('ALL');
    setWinnerDropdownFilters({});
    setWinnerSortConfig({ key: 'drawNumber', direction: 'asc' });
    setWinnerCurrentPage(1);
  };

  // Filtered Winners
  const filteredWinners = useMemo(() => {
    let result = [...eventWinners];

    // 1. Search Query
    if (winnerSearchQuery.trim()) {
      const q = winnerSearchQuery.toLowerCase().trim();
      result = result.filter(w => {
        const subData = w.submissionData || {};
        const dataValues = Object.entries(subData).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase();
        const pName = (w.prizeName || '').toLowerCase();
        const wName = (w.winnerName || '').toLowerCase();
        const rawTime = w.drawnAt || w.createdAt || '';
        const drawNum = String(w.drawNumber || '');
        return dataValues.includes(q) || pName.includes(q) || wName.includes(q) || rawTime.toLowerCase().includes(q) || drawNum.includes(q);
      });
    }

    // 2. Prize Filter
    if (winnerPrizeFilter !== 'ALL') {
      result = result.filter(w => (w.prizeName || '').trim() === winnerPrizeFilter);
    }

    // 3. Form Dropdown Filters
    Object.entries(winnerDropdownFilters).forEach(([fieldId, selectedVal]) => {
      if (selectedVal && selectedVal !== 'ALL') {
        const field = formFields.find(f => f.id === fieldId) || { id: fieldId, label: fieldId };
        result = result.filter(w => String(fieldValue(w.submissionData, field) ?? '').trim() === selectedVal);
      }
    });

    // 4. Sorting
    result.sort((a, b) => {
      let valA: number | string, valB: number | string;
      if (winnerSortConfig.key === 'drawNumber') {
        valA = a.drawNumber || 0;
        valB = b.drawNumber || 0;
      } else if (winnerSortConfig.key === 'prizeName') {
        valA = (a.prizeName || '').toLowerCase();
        valB = (b.prizeName || '').toLowerCase();
      } else if (winnerSortConfig.key === 'drawnAt') {
        valA = new Date(a.drawnAt || a.createdAt || 0).getTime();
        valB = new Date(b.drawnAt || b.createdAt || 0).getTime();
      } else {
        const field = formFields.find(f => f.id === winnerSortConfig.key || f.label === winnerSortConfig.key) || { id: winnerSortConfig.key, label: winnerSortConfig.key };
        // The first column falls back to the winner name when the answer is missing
        const isFirstColumn = winnerSortConfig.key === formFields[0]?.id;
        valA = String(fieldValue(a.submissionData, field) ?? (isFirstColumn ? a.winnerName : '') ?? '').toLowerCase();
        valB = String(fieldValue(b.submissionData, field) ?? (isFirstColumn ? b.winnerName : '') ?? '').toLowerCase();
      }

      if (valA < valB) return winnerSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return winnerSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [eventWinners, winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters, winnerSortConfig, formFields]);

  // Reset winner page when filters change
  useEffect(() => {
    setWinnerCurrentPage(1);
  }, [winnerSearchQuery, winnerPrizeFilter, winnerDropdownFilters, winnerPageSize]);

  // Pagination calculation for winners
  const totalFilteredWinners = filteredWinners.length;
  const totalWinnerPages = winnerPageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFilteredWinners / winnerPageSize));
  const paginatedWinners = useMemo(() => {
    if (winnerPageSize === 'all') return filteredWinners;
    const start = (winnerCurrentPage - 1) * winnerPageSize;
    return filteredWinners.slice(start, start + winnerPageSize);
  }, [filteredWinners, winnerCurrentPage, winnerPageSize]);

  const handleWinnerHeaderSort = (key: string) => {
    setWinnerSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: 'drawNumber', direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Export Winners CSV
  const handleExportWinnersCsv = () => {
    if (eventWinners.length === 0) return;

    const fieldHeaders = formFields.map(f => f.label || 'Field');
    const allHeaders = [
      'No Undian',
      ...fieldHeaders,
      'Hadiah / Sesi',
      'Waktu Menang (WIB)'
    ];

    const rows = filteredWinners.map((w, idx) => {
      const formattedTime = formatWibTimestamp(w.drawnAt || w.createdAt).exact || '-';
      return [
        `#${w.drawNumber || idx + 1}`,
        ...formFields.map((f, colIdx) => fieldValue(w.submissionData, f) ?? (colIdx === 0 ? w.winnerName : '-')),
        w.prizeName || 'Doorprize Utama',
        formattedTime
      ];
    });

    downloadCsv(`pemenang-undian-${slug(event?.title)}.csv`, allHeaders, rows);
  };

  // =========================================================================
  // LUCKY DRAW / DOORPRIZE LOGIC
  // =========================================================================
  const [prizeName, setPrizeName] = useState('Doorprize Utama');
  const [drawCount, setDrawCount] = useState(1);
  const [selectedDrawFieldId, setSelectedDrawFieldId] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [rollingName, setRollingName] = useState('Siap Mengundi...');
  const [latestWinners, setLatestWinners] = useState<AppItem[]>([]);
  const [showLatestWinnersModal, setShowLatestWinnersModal] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [winnerToDelete, setWinnerToDelete] = useState<AppItem | null>(null);

  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Automatically keep selectedDrawFieldId bound to the first or available field
  useEffect(() => {
    if (formFields.length > 0 && !formFields.some(f => f.id === selectedDrawFieldId)) {
      setSelectedDrawFieldId(formFields[0].id);
    }
  }, [formFields, selectedDrawFieldId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Candidates for Lucky Draw are STRICTLY from form submissions
  const allCandidates = useMemo(() => {
    const pool: DrawCandidate[] = [];
    const seen = new Set<string>();

    formSubmissions.forEach(sub => {
      const info = participantInfo(sub as { id: string; data?: SubmissionData }, formFields);
      const key = (info.name + '|' + info.identifier).toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push({
          id: info.id,
          submissionId: info.id,
          name: info.name,
          department: info.department,
          identifier: info.identifier,
          source: 'Form Pendaftaran',
          raw: sub
        });
      }
    });

    return pool;
  }, [formSubmissions, formFields]);

  // Eligible pool: candidates who haven't won yet
  const eligiblePool = useMemo(() => {
    return allCandidates.filter(c => {
      if (wonIdsSet.has(c.id)) return false;
      if (c.submissionId && wonIdsSet.has(c.submissionId)) return false;
      if (c.name && wonIdsSet.has(c.name.toLowerCase().trim())) return false;
      if (c.identifier && c.identifier !== '-' && wonIdsSet.has(c.identifier.toLowerCase().trim())) return false;
      return true;
    });
  }, [allCandidates, wonIdsSet]);

  // Helper to get candidate display value based on selectedDrawFieldId
  const drawField = formFields.find(f => f.id === selectedDrawFieldId) || formFields[0] || null;
  const getCandidateDrawDisplay = useCallback((candidate: DrawCandidate | undefined) => {
    if (!candidate) return '';
    const customVal = fieldValue(candidate.raw?.data, drawField);
    if (customVal !== undefined && customVal !== null && String(customVal).trim() !== '') {
      return String(customVal).trim();
    }
    return candidate.name || 'Kandidat';
  }, [drawField]);

  // Safe draw count clamping
  const handleDrawCountChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setDrawCount(1);
      return;
    }
    const maxAllowed = Math.max(1, eligiblePool.length);
    if (num > maxAllowed) {
      setDrawCount(maxAllowed);
    } else {
      setDrawCount(num);
    }
  };

  // Run Lucky Draw Spin with 10-Second Countdown
  const handleRunLuckyDraw = () => {
    if (isRolling || eligiblePool.length === 0 || !event) return;
    const requestedCount = Math.min(Math.max(1, drawCount || 1), eligiblePool.length);

    setIsRolling(true);
    setCountdown(10);
    setLatestWinners([]);

    // Spin candidate names rapidly every 65ms
    rollIntervalRef.current = setInterval(() => {
      const randomCandidate = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
      setRollingName(randomCandidate ? getCandidateDrawDisplay(randomCandidate) : 'Mengundi...');
    }, 65);

    let currentSec = 10;
    countdownIntervalRef.current = setInterval(() => {
      currentSec -= 1;
      setCountdown(currentSec);

      if (currentSec <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (rollIntervalRef.current) clearInterval(rollIntervalRef.current);

        // Pick winners using Fisher-Yates (Knuth) Shuffle with cryptographic randomness
        const shuffled = [...eligiblePool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          let rand: number;
          if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            window.crypto.getRandomValues(buf);
            rand = buf[0] / (0xffffffff + 1);
          } else {
            rand = Math.random();
          }
          const j = Math.floor(rand * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const chosen = shuffled.slice(0, requestedCount);

        const nowIso = new Date().toISOString();
        const fLabel = drawField?.label || 'Field Undian';

        const newWinners: AppItem[] = chosen.map((c, idx) => {
          const customFieldVal = String(fieldValue(c.raw?.data, drawField) ?? c.name ?? '');

          return {
            id: `draw-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            eventId: event.id,
            formId: connectedForm?.id || '',
            submissionId: c.submissionId || c.id,
            winnerName: c.name,
            winnerIdentifier: c.identifier || '-',
            winnerPhone: c.identifier || '-',
            winnerDepartment: c.department || '',
            winnerUnit: c.department || '',
            prizeTitle: prizeName.trim() || 'Doorprize Utama',
            prizeName: prizeName.trim() || 'Doorprize Utama',
            drawNumber: (eventWinners.length + idx + 1),
            source: c.source,
            drawnAt: nowIso,
            drawnFieldLabel: fLabel,
            drawnFieldValue: customFieldVal,
            submissionData: c.raw?.data || {}
          };
        });

        if (onAddLuckyDraw) {
          onAddLuckyDraw(newWinners);
        }

        setLatestWinners(newWinners);
        setIsRolling(false);
        setCountdown(10);
        setShowLatestWinnersModal(true);

        try {
          confetti({
            particleCount: 160,
            spread: 100,
            origin: { y: 0.6 }
          });
        } catch { /* confetti is decorative */ }
      }
    }, 1000);
  };

  return {
    activeAlert,
    extractParticipantName,
    initialRsvps,
    activeDiagramFieldId,
    activeView,
    allCandidates,
    choiceFields,
    connectedForm,
    formFields,
    copySuccess,
    countdown,
    currentPage,
    diagramData,
    drawCount,
    dropdownFields: choiceFields,
    dropdownFilters,
    effectiveIsLimited,
    effectiveMaxQuota,
    eligiblePool,
    event,
    eventWinners,
    filteredSubmissions,
    filteredWinners,
    formSubmissions,
    getDropdownOptions,
    getWinnerDisplayName,
    handleCopyLink,
    handleDrawCountChange,
    handleExportCsv,
    handleExportWinnersCsv,
    handleGeneratePoster,
    handleHeaderSort,
    handleResetFilters,
    handleResetWinnerFilters,
    handleRunLuckyDraw,
    handleWinnerHeaderSort,
    hasActiveFilters,
    hasActiveWinnerFilters,
    isFormClosed,
    isGeneratingPoster,
    isLuckyDrawEnabled,
    isRolling,
    latestWinners,
    navigateTo,
    onBack,
    onDeleteLuckyDraw,
    onNavigateForm,
    onResetLuckyDraw,
    pageSize,
    paginatedSubmissions,
    paginatedWinners,
    participationRate,
    posterModal,
    prizeName,
    qrCodeDataUrl,
    resetConfirmOpen,
    rollingName,
    searchPlaceholder,
    searchQuery,
    selectedDrawFieldId,
    setActiveAlert,
    setActiveDiagramFieldId,
    setActiveView,
    setCurrentPage,
    setDropdownFilters,
    setPageSize,
    setPosterModal,
    setPrizeName,
    setResetConfirmOpen,
    setSearchQuery,
    setSelectedDrawFieldId,
    setShowLatestWinnersModal,
    setWinnerCurrentPage,
    setWinnerDropdownFilters,
    setWinnerFilter,
    setWinnerPageSize,
    setWinnerPrizeFilter,
    setWinnerSearchQuery,
    setWinnerToDelete,
    showLatestWinnersModal,
    sortConfig,
    totalFiltered,
    totalFilteredWinners,
    totalPages,
    totalPendaftar,
    totalWinnerPages,
    uniquePrizeNames,
    winnerCurrentPage,
    winnerDropdownFilters,
    winnerFilter,
    winnerPageSize,
    winnerPrizeFilter,
    winnerSearchPlaceholder,
    winnerSearchQuery,
    winnerSortConfig,
    winnerToDelete,
    wonIdsSet
  };
}
