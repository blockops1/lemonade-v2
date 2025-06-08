/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [],
        unoptimized: false,
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    webpack: (config) => {
        // Add WASM support
        config.experiments = {
            ...config.experiments,
            asyncWebAssembly: true,
        };

        // Handle binary files
        config.module.rules.push({
            test: /\.(wasm|zkey)$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/chunks/[path][name][ext]'
            }
        });

        // Handle JSON imports
        config.module.rules.push({
            test: /\.json$/,
            type: 'json',
        });

        return config;
    },
    // Add security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    }
                ]
            }
        ];
    },
    // Add caching strategies
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: '/api/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'x-api-key',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
