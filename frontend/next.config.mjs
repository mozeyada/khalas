import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'X-Frame-Options', value: 'DENY'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // Content-Security-Policy
            // 'self' covers same-origin assets and the Next.js inline runtime.
            // TODO(security): Add nonce-based inline script policy once
            // Next.js 14 nonce support is confirmed stable in this project.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js needs 'unsafe-inline' for hydration styles in dev;
              // tighten to nonces in a production-hardened deployment.
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "img-src 'self' data: https:",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_BASE_URL || ''}`,
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
