/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/catalogo',
        destination: '/categorias',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
