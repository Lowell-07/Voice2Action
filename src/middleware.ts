import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur'],
 
  defaultLocale: 'en',
  
  localePrefix: 'always'
});
 
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
