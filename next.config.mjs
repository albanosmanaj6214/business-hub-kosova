/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse v2 ships a pdf.worker.mjs that webpack mis-bundles in
    // standalone output. Marking it as an external server package keeps
    // node's resolver finding it at runtime from node_modules.
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
}

export default nextConfig
