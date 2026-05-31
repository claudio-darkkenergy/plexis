import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import gruvbox from 'starlight-theme-gruvbox';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  output: 'static',
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      title: 'Plexis',
      description:
        'Zero-dependency TypeScript library for modeling business state with domain state machines and finite workflow pipelines.',
      plugins: [gruvbox()],
      components: {
        Banner: './src/components/Banner.astro',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Domain', slug: 'guides/domain' },
            { label: 'Pipeline', slug: 'guides/pipeline' },
            { label: 'Tracer', slug: 'guides/tracer' },
            { label: 'Error Handling', slug: 'guides/error-handling' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'API Route',        slug: 'guides/advanced/api-route' },
            { label: 'Multi-step Form',  slug: 'guides/advanced/multi-step-form' },
            { label: 'React',            slug: 'guides/advanced/react' },
            { label: 'Vue',              slug: 'guides/advanced/vue' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Overview',              slug: 'reference/api' },
            { label: 'Definition Functions',  slug: 'reference/definition-functions' },
            { label: 'Registration Helpers',  slug: 'reference/registration-helpers' },
            { label: 'Handler Input Types',   slug: 'reference/handler-inputs' },
            { label: 'Tracer',                slug: 'reference/tracer' },
            { label: 'Domain Instance',       slug: 'reference/domain' },
            { label: 'Pipeline Instance',     slug: 'reference/pipeline' },
            { label: 'Errors',                slug: 'reference/errors' },
            { label: 'Key Types',             slug: 'reference/types' },
          ],
        },
        {
          label: 'Contributing',
          items: [{ label: 'Contributor Guide', slug: 'contributing' }],
        },
      ],
    }),
  ],
});
