let rawBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
if (!rawBackendUrl.startsWith('http://') && !rawBackendUrl.startsWith('https://')) {
  rawBackendUrl = `https://${rawBackendUrl}`;
}
const backendUrl = rawBackendUrl.replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: '/dataset-documents/:path*',
        destination: `${backendUrl}/dataset-documents/:path*`,
      },
    ];
  },
};

export default nextConfig;
