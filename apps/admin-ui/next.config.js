//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');


/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  images: {
    // next/image only loads remote images from hosts listed here. Kept in step
    // with user-ui and seller-ui — the admin console shows the same products,
    // so a host missing here renders as a broken image only in this app.
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io' }, // product images
      { protocol: 'https', hostname: 'images.unsplash.com' }, // placeholder fallbacks
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' }, // icon placeholders
    ],
  }
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);

