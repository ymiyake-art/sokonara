"""
pip install selenium beautifulsoup4 webdriver-manager

Studio記事の移植スクリプト
- urls.txt（1行1URL）を読み込み
- 取得できた記事を output.json に出力
- エラーは error.log に記録
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service


ROOT = Path(__file__).resolve().parent
URLS_TXT = ROOT / "urls.txt"
OUT_JSON = ROOT / "output.json"
ERR_LOG = ROOT / "error.log"


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def _first_text(soup: BeautifulSoup, selectors: List[str]) -> str:
    for sel in selectors:
        el = soup.select_one(sel)
        if el:
            t = _clean(el.get_text(" ", strip=True))
            if t:
                return t
    return ""


def _extract_quote(soup: BeautifulSoup) -> str:
    bq = soup.select_one("blockquote")
    if bq:
        t = _clean(bq.get_text(" ", strip=True))
        if t:
            return t
    # fallback: 強調っぽいテキストを拾う
    for sel in ["strong", "em", ".quote", ".blockquote", ".rich-text blockquote"]:
        el = soup.select_one(sel)
        if el:
            t = _clean(el.get_text(" ", strip=True))
            if 12 <= len(t) <= 120:
                return t
    return ""


def _extract_body_and_photos(soup: BeautifulSoup) -> Tuple[str, List[str]]:
    # まず "記事っぽい" コンテナを探す（サイト側のDOM変更に強くするため複数候補）
    container = None
    for sel in [
        "article",
        "main article",
        "main",
        ".article",
        ".post",
        ".content",
        ".rich-text",
        "[data-testid='richText']",
    ]:
        container = soup.select_one(sel)
        if container:
            break
    if not container:
        container = soup

    # 画像URL（ページ内の全imgから一旦拾う→重複排除）
    photos: List[str] = []
    for img in container.select("img"):
        src = img.get("src") or ""
        if src.startswith("http"):
            photos.append(src)
    photos = list(dict.fromkeys(photos))

    # 本文（段落単位）
    paras = []
    for p in container.select("p"):
        t = _clean(p.get_text(" ", strip=True))
        if t:
            paras.append(t)
    if not paras:
        # fallback: container直下テキストを粗く整形
        text = _clean(container.get_text("\n", strip=True))
        paras = [line.strip() for line in text.split("\n") if line.strip()]

    body = "\n".join(paras)
    return body, photos


def fetch_one(driver: webdriver.Chrome, url: str) -> Optional[Dict[str, Any]]:
    driver.get(url)
    time.sleep(3)  # ページ読み込み待機（要件）
    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")

    # 経営者名・会社名はDOMに依存しやすいので複数候補で推定
    name = _first_text(
        soup,
        [
            "h1",
            "header h1",
            ".hero h1",
            ".company-hero h1",
            "[data-testid='pageTitle']",
        ],
    )
    company = _first_text(
        soup,
        [
            "header h2",
            ".hero h2",
            ".company-hero h2",
            "[data-testid='companyName']",
            "title",
        ],
    )

    body, photos = _extract_body_and_photos(soup)
    quote = _extract_quote(soup)

    if not body:
        raise ValueError("本文が取得できませんでした")

    # title 由来で会社名が混ざることがあるので軽く整形
    if company.lower().endswith(" | sokonara") or company.lower().endswith("| sokonara"):
        company = _clean(re.sub(r"\|\s*sokonara.*$", "", company, flags=re.I))

    return {
        "name": name or "",
        "company": company or "",
        "body": body,
        "quote": quote or "",
        "photos": photos,
    }


def main() -> None:
    urls = [u.strip() for u in URLS_TXT.read_text(encoding="utf-8").splitlines() if u.strip()]
    if not urls:
        print("urls.txt が空です")
        return

    chrome_opts = Options()
    chrome_opts.add_argument("--headless=new")
    chrome_opts.add_argument("--no-sandbox")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_argument("--lang=ja-JP")

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_opts)
    results: List[Dict[str, Any]] = []
    errors: List[str] = []

    try:
        for url in urls:
            try:
                item = fetch_one(driver, url)
                if item:
                    results.append(item)
            except Exception as e:
                errors.append(f"{url}\t{type(e).__name__}\t{e}")
    finally:
        driver.quit()

    OUT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    if errors:
        ERR_LOG.write_text("\n".join(errors) + "\n", encoding="utf-8")
    else:
        if ERR_LOG.exists():
            ERR_LOG.unlink()

    print(f"{len(results)}件取得完了")


if __name__ == "__main__":
    main()

"""
admin.html の localStorage に output.json をインポートする方法（例）:

1) 管理画面（admin.html）を開く
2) ブラウザの開発者ツール → Console で以下を実行

fetch('output.json')
  .then(r => r.json())
  .then(list => {
    const now = Date.now();
    const companies = JSON.parse(localStorage.getItem('sn_companies') || '[]');
    list.forEach((it, idx) => {
      companies.push({
        id: 'co_import_' + (now + idx),
        name: it.company || '会社名未取得',
        ceo: it.name || '経営者名未取得',
        type: 'successor',
        plan: 'standard',
        articleType: 'standard',
        tags: [],
        title: '',
        quote: it.quote || '',
        body: it.body || '',
        q1: [],
        photoUrl: (it.photos && it.photos[0]) ? it.photos[0] : '',
        industry: '',
        size: '',
        intro: '',
        fee: '',
        status: 'active',
        created: new Date().toLocaleDateString('ja-JP'),
        reactions: 0,
        cta: 0
      });
    });
    localStorage.setItem('sn_companies', JSON.stringify(companies));
    console.log('imported:', list.length);
  });
"""

