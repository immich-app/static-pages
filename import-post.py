# /// script
# requires-python = ">=3.14"
# dependencies = [
#   "requests == 2.32.5",
#   "python-frontmatter == 1.1.0",
#   "mistletoe == 1.5.0",
#   "pillow == 12.0.0",
#   "boto3 == 1.40.64"
# ]
# ///
import datetime
import hashlib
import os
import re
from io import BytesIO
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urlunparse

import boto3
import frontmatter
import mistletoe
import requests
from mistletoe import span_token
from mistletoe.markdown_renderer import MarkdownRenderer, Fragment
from PIL import Image

WEBP_QUALITY = 85
BLOG_PREFIX = "blog"
OUTPUT_BASE = Path("apps/root.immich.app/src/routes/blog")


def slugify(text: str) -> str:
  slug = text.lower().strip()
  slug = re.sub(r'[^\w\s-]', '', slug)
  slug = re.sub(r'[-\s]+', '-', slug)
  return slug.strip('-')


def hash_content(data: bytes) -> str:
  return hashlib.md5(data).hexdigest()


def download_image(url: str, auth_header: str) -> bytes:
  response = requests.get(url, headers={"Authorization": auth_header})
  response.raise_for_status()
  return response.content


def convert_to_webp(image_data: bytes, quality: int = WEBP_QUALITY) -> bytes:
  img = Image.open(BytesIO(image_data))

  if img.mode in ('RGBA', 'LA', 'P'):
    background = Image.new('RGB', img.size, (255, 255, 255))
    if img.mode == 'P':
      img = img.convert('RGBA')
    background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
    img = background
  elif img.mode != 'RGB':
    img = img.convert('RGB')

  output = BytesIO()
  img.save(output, format='WEBP', quality=quality)
  return output.getvalue()


class ImageProcessingRenderer(MarkdownRenderer):
  def __init__(self, importer: 'PostImporter', slug: str):
    super().__init__()
    self.importer = importer
    self.slug = slug

  def render_image(self, token: span_token.Image) -> Iterable[Fragment]:
    original_url = token.src
    if not original_url.startswith(('http://', 'https://')):
      parts = self.importer.outline_url_parts
      original_url = urlunparse(parts._replace(path=original_url))

    print(f"Processing image: {original_url}")

    image_data = download_image(original_url, self.importer.outline_auth_header)
    content_hash = hash_content(image_data)
    webp_data = convert_to_webp(image_data)

    s3_key = f"{BLOG_PREFIX}/{self.slug}/{content_hash}.webp"
    self.importer.upload_to_s3(webp_data, s3_key)

    token.src = f"{self.importer.r2_public_url}/{s3_key}"
    print(f"Replaced with: {token.src}")

    return super().render_image(token)


class PostImporter:
  def __init__(self):
    self.outline_auth_header = f"Bearer {os.environ["OUTLINE_API_KEY"]}"

    self.outline_url_parts = urlparse(os.environ["OUTLINE_POST_URL"])

    self.r2_bucket_name = os.environ["R2_BUCKET_NAME"]
    self.r2_public_url = os.environ["R2_PUBLIC_URL"].rstrip('/')

    self.s3 = boto3.client(
      's3',
      endpoint_url=os.environ["R2_ENDPOINT_URL"],
      aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"]
    )

  def fetch_post_from_outline(self) -> tuple[dict, frontmatter.Post]:
    post_id = self.outline_url_parts.path.removeprefix('/doc/').rstrip('/')
    api_url = urlunparse(self.outline_url_parts._replace(path='/api/documents.info'))

    headers = {"Authorization": self.outline_auth_header}
    response = requests.post(api_url, headers=headers, json={"id": post_id})
    response.raise_for_status()
    post = response.json()

    text = post['data']['text'].replace('\\---', '---', 2)
    post_data = frontmatter.loads(text)

    return post, post_data

  def clear_s3_directory(self, prefix: str) -> None:
    print(f"Clearing S3 directory: {prefix}")

    paginator = self.s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=self.r2_bucket_name, Prefix=prefix)

    objects_to_delete = []
    for page in pages:
      if 'Contents' in page:
        objects_to_delete.extend([{'Key': obj['Key']} for obj in page['Contents']])

    if objects_to_delete:
      self.s3.delete_objects(
        Bucket=self.r2_bucket_name,
        Delete={'Objects': objects_to_delete}
      )
      print(f"Deleted {len(objects_to_delete)} objects from {prefix}")

  def upload_to_s3(self, data: bytes, key: str, content_type: str = 'image/webp') -> None:
    response = self.s3.put_object(
      Bucket=self.r2_bucket_name,
      Key=key,
      Body=data,
      ContentType=content_type
    )
    etag = response.get('ETag', '').strip('"')
    print(f"Uploaded to S3: {key} (ETag: {etag})")

  def process_images(self, post_data: frontmatter.Post, slug: str) -> str:
    with ImageProcessingRenderer(self, slug) as renderer:
      doc = mistletoe.Document(post_data.content)  # TODO: Verify content has no frontmatter
      return renderer.render(doc)

  def update_frontmatter(self, post_data: frontmatter.Post, post: dict, slug: str) -> None:
    post_data['id'] = post['data']['id']
    post_data['title'] = post['data']['title']
    post_data['publishedAt'] = datetime.date.today()
    post_data['authors'] = ['Immich Team']
    post_data['slug'] = slug

  def write_output(self, post_data: frontmatter.Post, slug: str) -> Path:
    output_dir = OUTPUT_BASE / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "+page.md"

    output_file.write_text(frontmatter.dumps(post_data))
    return output_file

  def run(self) -> None:
    post, post_data = self.fetch_post_from_outline()
    slug = post_data.get('slug') or slugify(post['data']['title'])

    self.clear_s3_directory(f"{BLOG_PREFIX}/{slug}/")

    rendered_markdown = self.process_images(post_data, slug)
    post_data.content = rendered_markdown

    self.update_frontmatter(post_data, post, slug)
    output_file = self.write_output(post_data, slug)

    print(f"\nPost written to: {output_file}")
    print(f"Post slug: {slug}")


PostImporter().run()
