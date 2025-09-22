
import createMiddleware from 'next-intl/middleware';
 
// The locales are defined here
export const locales = ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'];
export const defaultLocale = 'en';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches
  defaultLocale,
  
  // The locale prefix is always used
  localePrefix: 'always'
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(hi|en|bn|te|ta|mr|gu|kn|ml|pa|ur)/:path*']
};
