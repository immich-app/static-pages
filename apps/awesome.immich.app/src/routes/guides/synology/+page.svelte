<script lang="ts">
  import { base } from '$app/paths';
</script>

<svelte:head>
  <title>SynoCommunity Package Install - awesome.immich.app</title>
</svelte:head>

<div class="guide">
  <a href="{base}/" class="back">&larr; Awesome Immich</a>

  <h1>Installing Immich via SynoCommunity Package</h1>

  <p>
    Immich is available as a native SPK package from the
    <a href="https://synocommunity.com/">SynoCommunity</a> repository.
    This method integrates Immich directly into DSM's Package Center and uses
    DSM's service management for lifecycle handling.
  </p>

  <h2>Prerequisites</h2>
  <ul>
    <li>DSM 7.2 or later (64-bit only)</li>
    <li>SynoCommunity repository added to Package Center</li>
  </ul>

  <blockquote>
    When you install the Immich package, Package Center will automatically prompt
    you to install any required dependencies (PostgreSQL, Redis, Node.js_v22,
    ffmpeg8, Perl, Python 3.14) if they aren't already installed. You do not
    need to install them manually beforehand.
  </blockquote>

  <h2>Step 1 &mdash; Install PostgreSQL</h2>

  <p>
    Install the PostgreSQL package from SynoCommunity if it isn't already present
    (Package Center will prompt you during Immich installation). During PostgreSQL
    installation, you will be prompted to create an administrator account with a
    username and password. Remember these credentials &mdash; you'll need them
    during the Immich installation.
  </p>

  <p>
    After installation, verify PostgreSQL is running on port <strong>5433</strong>
    (the SynoCommunity package uses this port to avoid conflict with Synology's
    built-in PostgreSQL on 5432). The SynoCommunity PostgreSQL package includes
    all extensions required by Immich: <code>unaccent</code>, <code>cube</code>,
    <code>earthdistance</code>, <code>pg_trgm</code>, <code>uuid-ossp</code>,
    and <code>vector</code> (pgvector for AI/ML search).
  </p>

  <h2>Step 2 &mdash; Install Immich</h2>

  <p>
    Install the Immich package from SynoCommunity. The installation wizard will
    guide you through three screens:
  </p>

  <h3>Database Configuration</h3>
  <ul>
    <li>Enter the PostgreSQL admin username and password you created in Step 1</li>
    <li>The installer will create a dedicated <code>immich</code> database user and database</li>
  </ul>

  <h3>Shared Folder</h3>
  <ul>
    <li>Select or create a DSM shared folder for media storage</li>
    <li>This folder will contain your photos, videos, and thumbnails</li>
    <li>Choose a volume with sufficient free space</li>
  </ul>

  <h3>Machine Learning (Optional)</h3>
  <ul>
    <li>If enabled, approximately 300 MB of Python machine learning dependencies will be downloaded and installed</li>
    <li>Provides smart search, facial recognition, and OCR capabilities</li>
    <li>Can be omitted if you don't need these features</li>
  </ul>

  <h2>Step 3 &mdash; Access Immich</h2>

  <p>
    Once the installation completes, Immich will start automatically. Access the
    web interface at:
  </p>

  <pre><code>http://&lt;your-nas-ip&gt;:2283</code></pre>

  <p>
    Follow the on-screen prompts to create your admin account and begin uploading
    photos.
  </p>

  <h2>Updating</h2>

  <p>
    The SynoCommunity package updates through DSM's Package Center. When an update
    is available, you'll see a notification and can update with a single click.
    The database and media files are preserved during updates.
  </p>

  <h2>Uninstalling</h2>

  <p>
    When uninstalling Immich, the wizard offers the option to export your Immich
    database in a format compatible with the upstream Immich backup mechanism. If
    you plan to migrate to a Docker installation later, enable this option and
    save the backup file to a safe location.
  </p>
</div>

<style>
  .guide {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
  }
  .back {
    display: inline-block;
    margin-bottom: 1rem;
    color: var(--accent, #6366f1);
    text-decoration: none;
    font-weight: 500;
  }
  h1 {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 1.25rem;
    margin-top: 2rem;
    margin-bottom: 0.5rem;
  }
  h3 {
    font-size: 1rem;
    margin-top: 1.25rem;
    margin-bottom: 0.25rem;
  }
  blockquote {
    border-left: 3px solid var(--accent, #6366f1);
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    background: rgba(99, 102, 241, 0.05);
    border-radius: 0 0.25rem 0.25rem 0;
  }
  pre {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
  }
  code {
    font-size: 0.875em;
  }
  a {
    color: var(--accent, #6366f1);
  }
</style>
