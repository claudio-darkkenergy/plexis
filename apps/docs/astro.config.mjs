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
          label: 'Concepts',
          items: [
            { label: 'The Two-Layer Model',      slug: 'concepts/two-layer-model' },
            { label: 'Context & Patches',        slug: 'concepts/context-and-patches' },
            { label: 'Execution & Lifecycle',    slug: 'concepts/execution-and-lifecycle' },
            { label: 'Definition Lifecycle',     slug: 'concepts/definition-lifecycle' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Domain',         slug: 'guides/domain' },
            { label: 'Pipeline',       slug: 'guides/pipeline' },
            { label: 'Tracer',         slug: 'guides/tracer' },
            { label: 'Error Handling', slug: 'guides/error-handling' },
          ],
        },
        {
          label: 'Patterns',
          items: [
            { label: 'Custom Merge',              slug: 'patterns/custom-merge' },
            { label: 'Composing Pipelines',       slug: 'patterns/composing-pipelines' },
            { label: 'Forks in Depth',            slug: 'patterns/forks-in-depth' },
            { label: 'Guards vs Forks',           slug: 'patterns/guards-vs-forks' },
            { label: 'Designing the State Graph', slug: 'patterns/designing-the-state-graph' },
            { label: 'Snapshots & Restore',       slug: 'patterns/snapshots-and-restore' },
            { label: 'Type-Safe Domains',         slug: 'patterns/type-safe-domains' },
            { label: 'Testing',                   slug: 'patterns/testing' },
            { label: 'Graph Introspection',       slug: 'patterns/graph-introspection' },
            { label: 'Reactive Subscriptions',    slug: 'patterns/reactive-subscriptions' },
            { label: 'Reusable Factories',        slug: 'patterns/reusable-factories' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'API Route',              slug: 'guides/advanced/api-route' },
            { label: 'Multi-step Form',        slug: 'guides/advanced/multi-step-form' },
            { label: 'Saga',                   slug: 'guides/advanced/saga' },
            { label: 'Persist & Rehydrate',    slug: 'guides/advanced/persist-and-rehydrate' },
            { label: 'State Graph Visualizer', slug: 'guides/advanced/state-graph-visualizer' },
          ],
        },
        {
          label: 'Integrations',
          items: [
            { label: 'React', slug: 'guides/integrations/react' },
            { label: 'Vue',   slug: 'guides/integrations/vue' },
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
