// Mobile Gallery & Media Permissions Helper for VERILANCE

export type GalleryPermissionLevel = 'prompt' | 'granted' | 'limited' | 'denied';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isSmallScreen = window.innerWidth <= 768;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return isMobileUA || (isSmallScreen && hasTouch);
}

export function getGalleryPermissionLevel(): GalleryPermissionLevel {
  try {
    const saved = localStorage.getItem('verilance_gallery_permission');
    if (saved === 'granted' || saved === 'limited' || saved === 'denied') {
      return saved as GalleryPermissionLevel;
    }
  } catch {
    // localStorage might be unavailable
  }
  return 'prompt';
}

export function hasGalleryAccess(): boolean {
  const level = getGalleryPermissionLevel();
  return level === 'granted' || level === 'limited';
}
