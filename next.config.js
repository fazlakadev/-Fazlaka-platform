  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // إعدادات خاصة بمكون <Image> في Next.js
    images: {
      // استخدام remotePatterns هو الطريقة الحديثة والمرنة للسماح بالصور الخارجية
      remotePatterns: [
        {
          // 1. البروتوكول: السماح فقط بالروابط الآمنة (HTTPS)
          protocol: 'https',
          
          // 2. اسم النطاق: علامة ** تعني "أي نطاق" (مثلاً: google.com, my-site.io, إلخ)
          hostname: '**',
          
          // 3. مسار الملف: علامة ** تعني "أي مسار" على النطاق (مثلاً: /image.png, /assets/img/logo.jpg)
          pathname: '/**',
        },
      ],
    },
    async headers() {
      return [
        {
          source: '/sw.js',
          headers: [{ key: 'Service-Worker-Allowed', value: '/' }]
        },
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,Cookie,Accept' },
          ]
        }
      ]
    }
  };

  // تصدير إعدادات Next.js لكي يستخدمها المشروع
  module.exports = nextConfig;