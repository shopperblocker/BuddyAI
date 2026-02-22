export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/assessment/:path*', '/onboarding/:path*'],
};
