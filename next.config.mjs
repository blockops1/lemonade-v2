/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [],
        unoptimized: true,
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
