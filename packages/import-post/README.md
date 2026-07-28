# @immich/import-post

Imports an [Outline](https://www.getoutline.com/) document into the blog. It:

1. Fetches the document from the Outline API.
2. Downloads every referenced image/video attachment.
3. Optimizes and uploads them to and R2 bucket using md5 hash as filename
4. Updates the markdown link to use static.immich.cloud
5. Writes the updated markdown to disk
6. Runs `prettier --write` on the file

## Usage

```bash
pnpm --filter @immich/import-post run import "<outline-post-url>"
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
