/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [],
        unoptimized: true,
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com;
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' data: blob:;
                            font-src 'self';
                            connect-src 'self' https://*.vercel-analytics.com;
                            frame-ancestors 'none';
                            form-action 'self';
                            base-uri 'self';
                            manifest-src 'self';
                        `.replace(/\s+/g, ' ').trim()
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    }
                ]
            }
        ];
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
};

export default nextConfig;
