declare module 'virtual:docs' {
  type Doc = import('@immich/svelte-markdown-preprocess').ClientDoc;

  export const getDocs: <T extends Doc = Doc>() => T[];
  export const getDoc: <T extends Doc = Doc>(ref: string) => T | undefined;
}
