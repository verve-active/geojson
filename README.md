# Verve GeoJSON

Source-neutral documentation for the Verve activity file format, an extension and
opinionated profile of GeoJSON. This repository contains an Astro Starlight site
with documentation written in Markdown.

## Status and documentation

The documentation is a draft targeting format version `1.0`. The detailed
specification, JSON Schemas, complete examples, and deployment workflow are still
in preparation.

- [Overview](src/content/docs/index.md): the current documentation entry point.
- [Initial design](2026-10-13-verve-geojson-design.md): the project direction and
  planned documentation; it is not a published format specification.

The Markdown documents will be authoritative; the website renders them for easier
reading and navigation. Once releases are tagged, reference a document at a
specific Git tag to identify the revision you used.

## Local development

Use Bun as both the package manager and JavaScript runtime. Astro and Starlight
are installed locally; no global Astro installation is needed.

Install the locked dependencies:

```sh
bun install --frozen-lockfile
```

Start the local development server in your terminal:

```sh
bun run dev
```

Open the URL printed by Astro (normally `http://localhost:4321`). Changes to the
Markdown pages refresh automatically. Stop the server with Ctrl+C.

Build and preview the static website:

```sh
bun run build
bun run preview
```

The build output is in `dist/`. Preview serves the built site; rerun the build to
include later changes. All package scripts explicitly run Astro using Bun.

## Editing documentation

Pages live in `src/content/docs/` as plain `.md` files with minimal frontmatter:

```md
---
title: Page title
description: A brief description of the page.
---

Page content.
```

Update the sidebar in `astro.config.mjs` when adding a substantive page.
`public/` contains files copied directly into the website build.
