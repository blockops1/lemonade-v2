/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lemonade-*.vercel.app',
            },
        ],
        unoptimized: true,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'],
        minimumCacheTTL: 60,
        dangerouslyAllowSVG: true,
        domains: ['zkverify.io'],
    },
    async headers() {
        console.log('[Next.js Config] Setting up headers');
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.vercel-analytics.com https://*.zkverify.io https://va.vercel-scripts.com;
                            style-src 'self' 'unsafe-inline'
                                https://fonts.googleapis.com;
                            img-src 'self' 
                                https://*.vercel-analytics.com 
                                https://*.zkverify.io 
                                https://zkverify-testnet.subscan.io 
                                https://*.subscan.io 
                                data: blob:;
                            font-src 'self' 
                                https://fonts.gstatic.com;
                            object-src 'none';
                            base-uri 'self';
                            form-action 'self';
                            frame-ancestors 'none';
                            block-all-mixed-content;
                            upgrade-insecure-requests;
                            worker-src 'self' blob:;
                            connect-src 'self' 
                                https://*.vercel-analytics.com 
                                wss://*.zkverify.io 
                                https://*.zkverify.io 
                                wss://zkverify-testnet.subscan.io 
                                https://zkverify-testnet.subscan.io
                                https://*.subscan.io
                                ws://localhost:3000
                                http://localhost:3000;
                            manifest-src 'self';
                            frame-src 'self';
                            media-src 'self';
                        `.replace(/\s+/g, ' ').trim()
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    }
                ]
            },
            {
                source: '/favicon.ico',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'image/x-icon',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000',
                    },
                ],
            },
        ];
    },
    webpack: (config, { isServer }) => {
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

        // Handle web-worker and other critical dependencies
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
                stream: false,
                buffer: false,
                util: false,
                assert: false,
                http: false,
                https: false,
                os: false,
                url: false,
            };
        }

        // Ignore web-worker warnings
        config.ignoreWarnings = [
            { module: /node_modules\/web-worker/ },
            { message: /Critical dependency: the request of a dependency is an expression/ },
        ];

        return config;
    }
};

export default nextConfig;
