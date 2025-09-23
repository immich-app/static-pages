<script lang="ts">
  import { Link } from '@immich/ui';

  type Props = {
    org?: string;
    repo?: string;
    number: number;
  };

  let { org = 'immich-app', repo = 'immich', number }: Props = $props();

  const getLink = (org: string, repo: string, number: number) => {
    const href = `https://github.com/${org}/${repo}/issues/${number}`;
    let text = `#${number}`;

    if (repo !== 'immich') {
      text = `${repo}#${number}`;
    }

    if (org !== 'immich-app') {
      text = `${org}/${repo}#${number}`;
    }

    return { href, text };
  };

  let { href, text } = $derived(getLink(org, repo, number));
</script>

<Link {href} external>{text}</Link>
