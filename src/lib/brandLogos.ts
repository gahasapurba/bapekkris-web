// Logos shown on the site, resized to twice their display height and served as WebP. The original
// PNGs in public/assets stay for link previews (Open Graph), the PDF export and the asset kit.

export interface LogoImage { src: string; width: number; height: number }

const logo = (file: string, width: number, height: number): LogoImage => ({ src: `/assets/web/${file}`, width, height });

export const BAPEKKRIS_LOGO = { light: logo('bapekkris-logo.webp', 228, 112), dark: logo('bapekkris-logo-white.webp', 228, 112) };
export const MANDIRI_LOGO = { light: logo('mandiri-logo.webp', 120, 48), dark: logo('mandiri-logo-white.webp', 120, 48) };
export const DANANTARA_LOGO = { light: logo('danantara-logo.webp', 192, 48), dark: logo('danantara-logo-white.webp', 192, 48) };

/** The logo variant for the current theme, ready to spread onto an <img>. */
export const logoFor = (set: { light: LogoImage; dark: LogoImage }, isDark: boolean): LogoImage => (isDark ? set.dark : set.light);
