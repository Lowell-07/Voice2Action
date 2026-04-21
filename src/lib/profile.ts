export const DEFAULT_PROFILE_IMAGE = '/images/default-profile.svg';

export function getProfileImageSrc(src?: string | null) {
  return src && src.trim().length > 0 ? src : DEFAULT_PROFILE_IMAGE;
}
