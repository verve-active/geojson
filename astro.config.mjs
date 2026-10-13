// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Verve GeoJSON',
      sidebar: [
        { label: 'Overview', slug: '' },
        { label: 'Core specification 1.0', slug: 'specification/core-1.0' },
        { label: 'Swimming metadata 1.0', slug: 'specification/swimming-1.0' },
        { label: 'Implementation notes', slug: 'implementation-notes' },
      ],
    }),
  ],
});
