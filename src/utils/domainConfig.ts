// Production Subdomain and Environment Configuration for KarMetra

export interface DomainConfig {
  mainDomain: string;
  publicAppUrl: string;
  candidateAppUrl: string;
  recruiterAppUrl: string;
  adminAppUrl: string;
  apiBaseUrl: string;
  helplinePhone: string;
  helplinePhoneDisplay: string;
  supportEmail: string;
  headOfficeAddress: string;
  headOfficeCity: string;
  isProduction: boolean;
}

// Read from Vite environment or use production defaults
const MAIN_DOMAIN = 'karmetra.in';
const metaEnv = (import.meta as any)?.env || {};

export const DOMAIN_CONFIG: DomainConfig = {
  mainDomain: MAIN_DOMAIN,
  publicAppUrl: metaEnv.VITE_PUBLIC_APP_URL || `https://${MAIN_DOMAIN}`,
  candidateAppUrl: metaEnv.VITE_CANDIDATE_APP_URL || `https://job.${MAIN_DOMAIN}`,
  recruiterAppUrl: metaEnv.VITE_RECRUITER_APP_URL || `https://recruiter.${MAIN_DOMAIN}`,
  adminAppUrl: metaEnv.VITE_ADMIN_APP_URL || `https://admin.${MAIN_DOMAIN}`,
  apiBaseUrl: metaEnv.VITE_API_BASE_URL || '/api',
  helplinePhone: '9049217304',
  helplinePhoneDisplay: '+91 90492 17304',
  supportEmail: 'support@karmetra.in',
  headOfficeAddress: 'KarMetra Enterprise Hub, G-Block, Bandra Kurla Complex (BKC)',
  headOfficeCity: 'Mumbai, Maharashtra 400051, India',
  isProduction: metaEnv.PROD || false,
};

export type SubdomainType = 'main' | 'candidate' | 'employer' | 'admin' | 'preview';

/**
 * Detect the current subdomain from the window location hostname or environment variable.
 */
export function getCurrentSubdomain(): SubdomainType {
  // Check if build environment specifies a default portal
  const envPortal = metaEnv.VITE_DEFAULT_PORTAL?.toLowerCase();
  if (envPortal === 'candidate' || envPortal === 'employer' || envPortal === 'recruiter' || envPortal === 'admin' || envPortal === 'main') {
    return envPortal === 'recruiter' ? 'employer' : envPortal as SubdomainType;
  }

  if (typeof window === 'undefined') return 'preview';

  const hostname = window.location.hostname.toLowerCase();

  // If on actual karmetra domain
  if (hostname === 'job.karmetra.in') return 'candidate';
  if (hostname === 'recruiter.karmetra.in' || hostname === 'employer.karmetra.in') return 'employer';
  if (hostname === 'admin.karmetra.in') return 'admin';
  if (hostname === 'karmetra.in' || hostname === 'www.karmetra.in') return 'main';

  // Subdomain prefixes for local testing or staging (e.g. job.localhost, admin.localhost)
  if (hostname.startsWith('job.')) return 'candidate';
  if (hostname.startsWith('recruiter.') || hostname.startsWith('employer.')) return 'employer';
  if (hostname.startsWith('admin.')) return 'admin';

  // AI Studio preview, localhost, Cloud Run preview
  return 'preview';
}


/**
 * Get target URL for a portal in production vs preview mode.
 */
export function getPortalUrl(portal: 'main' | 'candidate' | 'employer' | 'admin'): string {
  switch (portal) {
    case 'candidate':
      return DOMAIN_CONFIG.candidateAppUrl;
    case 'employer':
      return DOMAIN_CONFIG.recruiterAppUrl;
    case 'admin':
      return DOMAIN_CONFIG.adminAppUrl;
    case 'main':
    default:
      return DOMAIN_CONFIG.publicAppUrl;
  }
}

/**
 * Navigate to a specific portal respecting production subdomain boundaries.
 */
export function navigateToPortal(
  portal: 'main' | 'candidate' | 'employer' | 'admin',
  inAppFallbackCallback?: () => void
) {
  const currentSubdomain = getCurrentSubdomain();

  // If in production domain mode (on karmetra.in or its subdomains)
  if (typeof window !== 'undefined' && window.location.hostname.includes('karmetra.in')) {
    const targetUrl = getPortalUrl(portal);
    if (window.location.origin !== targetUrl) {
      window.location.href = targetUrl;
      return;
    }
  }

  // Preview / Local single-origin fallback
  if (inAppFallbackCallback) {
    inAppFallbackCallback();
  }
}
