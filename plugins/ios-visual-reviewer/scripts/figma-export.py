"""
Figma Export — 從 Figma URL 導出 frame 截圖

用法:
  python scripts/figma-export.py "<figma_url>" --output design.png [--scale 2] [--node-id <id>]

環境變數:
  FIGMA_ACCESS_TOKEN — Figma Personal Access Token
"""

import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error


def parse_figma_url(url: str) -> tuple[str, str | None]:
    """從 Figma URL 解析 file_key 和 node_id"""
    # Match: figma.com/file/XXXXX or figma.com/design/XXXXX
    match = re.search(r'figma\.com/(?:file|design)/([a-zA-Z0-9]+)', url)
    if not match:
        print(f"Error: 無法解析 Figma URL — {url}")
        sys.exit(1)

    file_key = match.group(1)

    # Extract node-id from query params
    node_match = re.search(r'node-id=([^&]+)', url)
    node_id = node_match.group(1) if node_match else None

    return file_key, node_id


def get_figma_image(file_key: str, node_id: str, token: str, scale: int = 2) -> str:
    """呼叫 Figma API 取得圖片 URL"""
    # URL encode the node_id (replace - with :)
    encoded_node_id = node_id.replace('-', ':')

    api_url = f"https://api.figma.com/v1/images/{file_key}?ids={encoded_node_id}&scale={scale}&format=png"

    req = urllib.request.Request(api_url)
    req.add_header('X-Figma-Token', token)

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())

        if data.get('err'):
            print(f"Error: Figma API — {data['err']}")
            sys.exit(1)

        images = data.get('images', {})
        if not images:
            print("Error: Figma API 沒有回傳圖片")
            sys.exit(1)

        # Get the first image URL
        image_url = list(images.values())[0]
        if not image_url:
            print("Error: 圖片 URL 為空，確認 node-id 是否正確")
            sys.exit(1)

        return image_url

    except urllib.error.HTTPError as e:
        print(f"Error: Figma API HTTP {e.code} — {e.reason}")
        if e.code == 403:
            print("Token 可能過期或沒有權限存取此檔案")
        sys.exit(1)


def download_image(url: str, output_path: str):
    """下載圖片到本地"""
    try:
        urllib.request.urlretrieve(url, output_path)
        print(f"Downloaded: {output_path}")
    except Exception as e:
        print(f"Error: 下載失敗 — {e}")
        sys.exit(1)


def get_file_nodes(file_key: str, token: str) -> list:
    """取得 Figma 檔案的所有頂層 frame（用於沒有指定 node-id 時）"""
    api_url = f"https://api.figma.com/v1/files/{file_key}?depth=1"

    req = urllib.request.Request(api_url)
    req.add_header('X-Figma-Token', token)

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())

        pages = data.get('document', {}).get('children', [])
        frames = []
        for page in pages:
            for child in page.get('children', []):
                if child.get('type') == 'FRAME':
                    frames.append({
                        'id': child['id'],
                        'name': child['name'],
                        'page': page['name']
                    })

        return frames

    except urllib.error.HTTPError as e:
        print(f"Error: Figma API HTTP {e.code}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Figma Export — 導出 Figma frame 截圖")
    parser.add_argument("figma_url", help="Figma 檔案或 frame URL")
    parser.add_argument("--output", type=str, default="figma-export.png", help="輸出檔名")
    parser.add_argument("--scale", type=int, default=2, help="縮放倍數（預設 2）")
    parser.add_argument("--node-id", type=str, default=None, help="指定 node ID（覆蓋 URL 中的）")
    args = parser.parse_args()

    # Check token
    token = os.environ.get('FIGMA_ACCESS_TOKEN')
    if not token:
        print("Error: 環境變數 FIGMA_ACCESS_TOKEN 未設定")
        print("取得方式：Figma → Settings → Personal access tokens → Generate")
        sys.exit(1)

    # Parse URL
    file_key, url_node_id = parse_figma_url(args.figma_url)
    node_id = args.node_id or url_node_id

    print(f"File key: {file_key}")
    print(f"Node ID: {node_id or '(未指定，將列出所有 frame)'}")
    print(f"Scale: {args.scale}x")

    if not node_id:
        # List available frames
        frames = get_file_nodes(file_key, token)
        if not frames:
            print("Error: 檔案中找不到任何 frame")
            sys.exit(1)

        print(f"\n找到 {len(frames)} 個 frame：")
        for i, f in enumerate(frames):
            print(f"  {i+1}. [{f['page']}] {f['name']} (id: {f['id']})")
        print(f"\n請用 --node-id 指定要導出的 frame，例如：")
        print(f"  python scripts/figma-export.py \"{args.figma_url}\" --node-id \"{frames[0]['id']}\"")
        sys.exit(0)

    # Get image URL from Figma API
    print(f"\n正在從 Figma API 取得圖片...")
    image_url = get_figma_image(file_key, node_id, token, args.scale)

    # Download
    print(f"正在下載...")
    download_image(image_url, args.output)

    print(f"\n完成! 設計稿已導出至: {args.output}")


if __name__ == "__main__":
    main()
