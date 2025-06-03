/** @type {import('next').NextConfig} */
const nextConfig = {
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
        });

        return config;
    },
};

export default nextConfig;
