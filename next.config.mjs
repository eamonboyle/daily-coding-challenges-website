/** @type {import('next').NextConfig} */
const nextConfig = {
    // Playwright and local tooling often hit 127.0.0.1 while `next dev` serves localhost.
    allowedDevOrigins: ["127.0.0.1", "localhost"]
}

export default nextConfig
