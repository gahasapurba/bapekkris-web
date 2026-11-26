import { useState, useEffect, useRef, type SyntheticEvent } from 'react';
import type { AppItem } from '../../lib/supabase';
import { useAppNavigate } from '../../lib/appNavigation';
import { formatWibDateTime } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';

/** Album selection (synced with the URL), filters, photo navigation and sharing of the gallery. */
export interface UseGalleryProps {
  galleries?: AppItem[];
  divisions?: AppItem[];
  events?: AppItem[];
  activeTenure?: AppItem | null;
  tenures?: AppItem[];
  initialGalleryId?: string | null;
  onSelectGalleryUrl?: (galleryId: string | null) => void;
  onNavigateEvent?: (eventId: string) => void;
}

export type GalleryState = ReturnType<typeof useGallery>;

export function useGallery({
  galleries = [],
  divisions = [],
  events = [],
  activeTenure = null,
  tenures = [],
  initialGalleryId = null,
  onSelectGalleryUrl,
  onNavigateEvent
}: UseGalleryProps) {
  const navigateTo = useAppNavigate();
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [copiedGalleryId, setCopiedGalleryId] = useState<string | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [divFilter, setDivFilter] = useState('all');
  const [tenureFilter, setTenureFilter] = useState('active'); // 'active' | 'all'
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryNotFound, setGalleryNotFound] = useState(false);

  const scopedGalleries = (tenureFilter === 'active' && activeTenure?.id)
    ? galleries.filter(g => g.tenureId === activeTenure.id)
    : galleries;

  const scopedDivisions = (tenureFilter === 'active' && activeTenure?.id)
    ? divisions.filter(d => d.tenureId === activeTenure.id)
    : divisions;

  const uniqueDivisions: string[] = Array.from(
    new Set([
      ...scopedDivisions.map(d => d.name),
      ...scopedGalleries.map(g => g.divisionName || g.division).filter(Boolean)
    ])
  );

  useEffect(() => {
    if (divFilter === 'all') return;
    const isValid = scopedDivisions.some(d => d.id === divFilter) ||
      divisions.some(d => d.id === divFilter) ||
      uniqueDivisions.includes(divFilter);
    if (!isValid) {
      setDivFilter('all');
    }
  }, [tenureFilter, activeTenure?.id, divisions]);

  const selectedDivObj = divisions.find(d => d.id === divFilter);
  const selectedDivName = selectedDivObj ? selectedDivObj.name : divFilter;

  const filteredGalleries = scopedGalleries.filter(g => {
    const matchesDiv = divFilter === 'all' || 
      g.divisionId === divFilter || 
      (selectedDivObj && g.divisionId === selectedDivObj.id) ||
      g.division === selectedDivName || 
      g.divisionName === selectedDivName;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (g.title || '').toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      (g.date || '').toLowerCase().includes(q);
    return matchesDiv && matchesSearch;
  });

  const activeEvent: AppItem | null =
    filteredGalleries.find(g => g.id === selectedGalleryId) ||
    filteredGalleries[0] ||
    null;

  const eventPhotos: string[] = Array.isArray(activeEvent?.photos) ? activeEvent.photos : [];

  const nextPhoto = () => {
    if (eventPhotos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % eventPhotos.length);
  };

  const prevPhoto = () => {
    if (eventPhotos.length <= 1) return;
    setCurrentPhotoIdx((prev) => (prev - 1 + eventPhotos.length) % eventPhotos.length);
  };

  useEffect(() => {
    setCurrentPhotoIdx(0);
  }, [activeEvent?.id, divFilter, tenureFilter, searchQuery]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, activeEvent, eventPhotos.length]);

  const safePhotoIdx = eventPhotos.length > 0 && currentPhotoIdx < eventPhotos.length ? currentPhotoIdx : 0;
  const currentPhotoUrl = eventPhotos[safePhotoIdx] || eventPhotos[0] || '/assets/mandiri-club-bapekkris-original.png';

  const getDownloadPhotoUrl = (url: string) => {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('supabase.co/storage/v1/')) {
      return url.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/v1\//, '/storage-proxy/');
    }
    return url;
  };

  // Gallery id from the URL that has been applied to the view. Data refreshes re-run the effect,
  // so filters and search are only reset when the URL points at a different gallery.
  const appliedGalleryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialGalleryId && galleries.length > 0) {
      const found = galleries.find(g => g.id === initialGalleryId);
      if (found) {
        setGalleryNotFound(false);
        if (appliedGalleryIdRef.current !== initialGalleryId) {
          appliedGalleryIdRef.current = initialGalleryId;
          setSelectedGalleryId(initialGalleryId);
          setCurrentPhotoIdx(0);
          setDivFilter('all');
          setSearchQuery('');
          if (activeTenure && found.tenureId !== activeTenure.id) {
            setTenureFilter('all');
          }
          const targetIdx = galleries.findIndex(g => g.id === initialGalleryId);
          if (targetIdx !== -1) {
            setGalleryPage(Math.floor(targetIdx / 6) + 1);
          }
        }
      } else {
        setGalleryNotFound(true);
      }
    } else if (!initialGalleryId) {
      setGalleryNotFound(false);
      // Back to the plain gallery page (e.g. browser Back): show the default selection again.
      if (appliedGalleryIdRef.current !== null) {
        appliedGalleryIdRef.current = null;
        setSelectedGalleryId(null);
        setCurrentPhotoIdx(0);
      }
    }
  }, [initialGalleryId, galleries, activeTenure]);

  const getGalleryShareUrl = (galId: string) => {
    const origin = getPublicBaseUrl();
    return `${origin}/?gallery=${encodeURIComponent(galId)}#galeri`;
  };

  const handleCopyGalleryLink = (gal: AppItem | null, e?: SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!gal) return;
    try {
      navigator.clipboard.writeText(getGalleryShareUrl(gal.id));
      setCopiedGalleryId(gal.id);
      setTimeout(() => setCopiedGalleryId(null), 2500);
    } catch { /* clipboard unavailable */ }
  };

  const handleShareGalleryWa = (gal: AppItem | null, e?: SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!gal) return;
    const url = getGalleryShareUrl(gal.id);
    const dateText = formatWibDateTime(gal.date) || '';
    const divText = gal.divisionName || gal.division || 'Bapekkris Bank Mandiri';
    const descText = gal.description ? (gal.description.length > 150 ? gal.description.slice(0, 147) + '...' : gal.description) : '';

    const text = `📸 *Dokumentasi Kegiatan Bapekkris Bank Mandiri*\n*${gal.title}*\n${dateText ? `📅 ${dateText} • ${divText}\n` : ''}${descText ? `\n"${descText}"\n` : ''}\nLihat foto dokumentasi selengkapnya di web:\n${url}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSelectGallery = (gId: string) => {
    setSelectedGalleryId(gId);
    setCurrentPhotoIdx(0);
    if (onSelectGalleryUrl) {
      onSelectGalleryUrl(gId);
    }
  };

  return {
    galleries,
    divisions,
    events,
    activeTenure,
    tenures,
    onNavigateEvent,
    onSelectGalleryUrl,
    navigateTo,
    copiedGalleryId,
    currentPhotoIdx,
    setCurrentPhotoIdx,
    searchQuery,
    setSearchQuery,
    divFilter,
    setDivFilter,
    tenureFilter,
    setTenureFilter,
    isLightboxOpen,
    setIsLightboxOpen,
    galleryPage,
    setGalleryPage,
    galleryNotFound,
    setGalleryNotFound,
    scopedGalleries,
    scopedDivisions,
    uniqueDivisions,
    filteredGalleries,
    activeEvent,
    eventPhotos,
    nextPhoto,
    prevPhoto,
    safePhotoIdx,
    currentPhotoUrl,
    getDownloadPhotoUrl,
    handleCopyGalleryLink,
    handleShareGalleryWa,
    handleSelectGallery
  };
}
