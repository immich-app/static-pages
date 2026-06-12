# /// script
# dependencies = [
#   "requests == 2.32.5",
#   "python-frontmatter == 1.1.0",
#   "mistletoe == 1.5.0",
#   "pillow == 12.0.0",
#   "boto3 == 1.40.64",
#   "pyyaml == 6.0.3"
# ]
# ///
import datetime
import hashlib
import os
import re
import select
import subprocess
import sys
import yaml
import time
from io import BytesIO
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urljoin, urlparse, urlunparse

import boto3
import frontmatter
import mistletoe
import requests
from mistletoe import span_token
from mistletoe.markdown_renderer import MarkdownRenderer, Fragment
from PIL import Image

WEBP_QUALITY = 85
BLOG_PREFIX = "blog"
SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_BASE = SCRIPT_DIR / "apps/root.immich.app/src/routes/blog"


def slugify(text: str) -> str:
  slug = text.lower().strip()
  slug = re.sub(r'[^\w\s-]', '', slug)
  slug = re.sub(r'[-\s]+', '-', slug)
  return slug.strip('-')


def hash_content(data: bytes) -> str:
  return hashlib.md5(data).hexdigest()


def extract_id(url: str) -> str:
  # https://outline.immich.cloud/api/attachments.redirect?id=1315cf2a-80af-4f16-8caa-8bfcf56da74f -> 1315cf2a-80af-4f16-8caa-8bfcf56da74f
  return parse_qs(urlparse(url).query).get('id', [url])[0]


def download_media(url: str, auth_header: str) -> tuple[bytes, str]:
  response = requests.get(url, headers={"Authorization": auth_header})
  response.raise_for_status()
  content_type = response.headers['Content-Type']  # ensure content type is present
  return (response.content, content_type)


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

class FlowList(list):
    pass

def represent_flow_list(dumper, data):
    return dumper.represent_sequence(
        "tag:yaml.org,2002:seq",
        data,
        flow_style=True,
    )

yaml.add_representer(FlowList, represent_flow_list, Dumper=yaml.SafeDumper)


class ImageProcessingRenderer(MarkdownRenderer):
  cover_image: span_token.Image | None = None

  def __init__(self, importer: 'PostImporter', uuid: str, first_as_cover: bool = False):
    super().__init__()
    self.importer = importer
    self.uuid = uuid
    self.first_as_cover = first_as_cover

  def render_link(self, token: span_token.Link) -> Iterable[Fragment]:
    original_url = token.target

    # assume all attachment links are videos?
    if not original_url.startswith('/api/attachments.redirect'):
      return super().render_link(token)

    attachment_id = extract_id(original_url)

    original_url = urlunparse(self.importer.outline_url_parts._replace(path=token.target))

    video_data, content_type = download_media(original_url, self.importer.outline_auth_header)
    if content_type != 'video/mp4':
      print(f"Warning: Expected video/mp4 but got {content_type} for {attachment_id}")
      return super().render_link(token)

    content_hash = hash_content(video_data)

    print(f"Processing attachment: {attachment_id} ({content_type})")

    s3_key = f"{BLOG_PREFIX}/{self.uuid}/{content_hash}.mp4"
    self.importer.upload_to_s3(video_data, s3_key, content_type='video/mp4')

    src = f"{self.importer.r2_public_url}/{s3_key}"
    print(f"Replaced with: {src}")

    title = getattr(token, "title", None)

    # outline puts dimensions in the title
    if getattr(token, "title", None) and token.title.startswith(" ="):
      title = None

    template = '<video autoplay src="{src}"{title} controls>Your browser does not support the video tag.</video>'
    title_template = ' title="{title}"'

    return [Fragment(text=template.format(src=src, title=title_template.format(title=title) if title else ''))]


  def render_image(self, token: span_token.Image) -> Iterable[Fragment]:
    original_url = token.src
    if not original_url.startswith(('http://', 'https://')):
      parts = self.importer.outline_url_parts
      original_url = urlunparse(parts._replace(path=original_url))

    image_data, content_type = download_media(original_url, self.importer.outline_auth_header)

    print(f"Processing attachment: {extract_id(original_url)} ({content_type})")

    content_hash = hash_content(image_data)
    webp_data = convert_to_webp(image_data)

    s3_key = f"{BLOG_PREFIX}/{self.uuid}/{content_hash}.webp"
    self.importer.upload_to_s3(webp_data, s3_key, content_type='image/webp')

    token.src = f"{self.importer.r2_public_url}/{s3_key}"

    # outline puts dimensions in the title
    if getattr(token, "title", None) and token.title.startswith(" ="):
        token.title = None

    if self.first_as_cover and self.cover_image is None:
      self.cover_image = token
      return ""

    return super().render_image(token)


class PostImporter:
  def __init__(self, post_url: str):
    self.outline_auth_header = f"Bearer {os.environ["OUTLINE_API_KEY"]}"
    self.outline_url_parts = urlparse(post_url)
    self.r2_bucket_name = os.environ["R2_BUCKET_NAME"]
    self.r2_public_url = os.environ["R2_PUBLIC_URL"].rstrip('/')

    self.s3 = boto3.client(
      's3',
      endpoint_url=os.environ["R2_ENDPOINT_URL"],
      aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
      aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"]
    )

    self.existing_keys: set[str] = set()
    self.referenced_keys: set[str] = set()

  def fetch_post_from_outline(self) -> tuple[dict, frontmatter.Post]:
    post_id = self.outline_url_parts.path.removeprefix('/doc/').rstrip('/')
    api_url = urlunparse(self.outline_url_parts._replace(path='/api/documents.info'))

    headers = {"Authorization": self.outline_auth_header}
    response = requests.post(api_url, headers=headers, json={"id": post_id})
    response.raise_for_status()
    post = response.json()

    text = post['data']['text'].replace('---', '---', 2)

    post_data = frontmatter.loads(text)

    return post, post_data

  def list_s3_keys(self, prefix: str) -> set[str]:
    paginator = self.s3.get_paginator('list_objects_v2')
    pages = paginator.paginate(Bucket=self.r2_bucket_name, Prefix=prefix)

    keys: set[str] = set()
    for page in pages:
      for obj in page.get('Contents', []):
        keys.add(obj['Key'])

    return keys

  def delete_unreferenced(self) -> None:
    stale_keys = self.existing_keys - self.referenced_keys
    if not stale_keys:
      return

    self.s3.delete_objects(
      Bucket=self.r2_bucket_name,
      Delete={'Objects': [{'Key': key} for key in stale_keys]}
    )

  def upload_to_s3(self, data: bytes, key: str, content_type: str) -> None:
    self.referenced_keys.add(key)

    if key in self.existing_keys:
      return

    response = self.s3.put_object(
      Bucket=self.r2_bucket_name,
      Key=key,
      Body=data,
      ContentType=content_type
    )
    etag = response.get('ETag', '').strip('"')
    print(f"Uploaded: {key}")

  def write_output(self, post_data: frontmatter.Post, folder: str) -> Path:
    output_dir = OUTPUT_BASE / folder
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "+page.md"

    output_file.write_text(frontmatter.dumps(post_data, Dumper=yaml.SafeDumper))

    print(f"\nprettier --write")
    result = subprocess.run(
      ["pnpm", "exec", "prettier", "--write", str(output_file)],
      cwd=SCRIPT_DIR,
      check=True,
      capture_output=True,
      text=True,
    )
    for line in (result.stdout + result.stderr).splitlines():
      print(f"> {line}")

    return output_file

  def run(self) -> None:
    post, post_data = self.fetch_post_from_outline()
    uuid = post['data']['id']
    title = post_data.get('title') or post['data']['title']
    slug = post_data.get('slug') or slugify(title)
    post_type = post_data.get('type') or 'post'
    folder = f"({post_type}s)/{slug}"
    bucket = f"{BLOG_PREFIX}/{uuid}/"
    output_relative = f"src/routes/blog/{folder}/+page.md"

    print(f"Importing:\n  ID:    {uuid}\n  Title: {title}\n  Path:  {output_relative}\n  Bucket:  {bucket}")
    print("Continue? [Y/n] (continuing in 5s) ", end="", flush=True)
    ready, _, _ = select.select([sys.stdin], [], [], 5)
    answer = sys.stdin.readline().strip().lower() if ready else ""
    print()
    if answer.startswith("n"):
      return


    self.existing_keys = self.list_s3_keys(f"{bucket}")

    with ImageProcessingRenderer(self, uuid, first_as_cover=post_type != 'release') as renderer:
      doc = mistletoe.Document(post_data.content)

      post_data.content = renderer.render(doc)
      post_data['id'] = uuid
      post_data['title'] = title

      if 'publishedAt' not in post_data:
        post_data['publishedAt'] = datetime.date.today()
      post_data['authors'] = FlowList(['Immich Team'])
      post_data['slug'] = slug

      if renderer.cover_image:
        post_data['coverUrl'] = renderer.cover_image.src
        post_data['coverAlt'] = "".join(child.content for child in getattr(renderer.cover_image, "children", []) if hasattr(child, "content"))

    uploaded = len(self.referenced_keys - self.existing_keys)
    unchanged = len(self.referenced_keys & self.existing_keys)
    deleted = len(self.existing_keys - self.referenced_keys)
    print(f"\nBucket stats (uploaded={uploaded}, unchanged={unchanged}, deleted={deleted})")

    self.delete_unreferenced()

    output_file = self.write_output(post_data, folder)

    print(f"\nhttp://localhost:5173/blog/{slug}")

    if output := os.environ.get('GITHUB_OUTPUT'):
      with open(output, 'a') as o:
        o.write(f"slug={slug}\n")
        o.write(f"uuid={uuid}\n")


if len(sys.argv) != 2:
  print(f"Usage: {sys.argv[0]} <outline-post-url>", file=sys.stderr)
  sys.exit(1)

PostImporter(sys.argv[1]).run()
