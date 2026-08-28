# @immich/import-post

Imports an [Outline](https://www.getoutline.com/) document into the blog. It:

1. Fetches the document from the Outline API.
2. Downloads every referenced image/video attachment.
3. Optimizes each image into a responsive ladder, capped at the source width, and uploads every
   rung to R2 as `<hash>-<rung>.<ext>`. The hash covers the source bytes and the pipeline version,
   so an encoder change invalidates what is already in the bucket.
4. Replaces the markdown image with `<Markdown.Image src srcset width height alt />`, so a post
   keeps the variants it was built with and a later ladder change cannot orphan it.
5. Writes the updated markdown to disk
6. Runs `prettier --write` on the file

## Usage

```bash
mise import-post "<outline-post-url>"
```

Required environment variables:

| Variable               | Description                         |
| ---------------------- | ----------------------------------- |
| `OUTLINE_API_KEY`      | Outline API token                   |
| `R2_BUCKET_NAME`       | Target bucket                       |
| `R2_ENDPOINT_URL`      | S3-compatible endpoint              |
| `R2_ACCESS_KEY_ID`     | Access key                          |
| `R2_SECRET_ACCESS_KEY` | Secret key                          |
| `R2_PUBLIC_URL`        | Public base URL for uploaded assets |

The post URL may also be supplied via `OUTLINE_POST_URL` instead of an argument.
