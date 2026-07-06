"""Convert MD -> HTML (with print-friendly CSS) -> PDF via Edge headless."""
import markdown
import subprocess
import os
import sys

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
DOCS = os.path.dirname(os.path.abspath(__file__))

CSS = """
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  body {
    font-family: -apple-system, "Segoe UI", Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 100%;
  }
  h1 { font-size: 22pt; border-bottom: 2px solid #DA1F26; padding-bottom: 6px; margin-top: 24px; color: #5E0B0F; }
  h2 { font-size: 16pt; margin-top: 28px; color: #5E0B0F; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 13pt; margin-top: 20px; color: #333; }
  h4 { font-size: 11.5pt; margin-top: 16px; color: #333; }
  p, li { font-size: 10.5pt; }
  ul, ol { padding-left: 22px; }
  li { margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; page-break-inside: avoid; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-weight: 700; }
  code {
    background: #f4f4f4;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: "Consolas", "Courier New", monospace;
    font-size: 9.5pt;
  }
  pre {
    background: #f7f7f7;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    padding: 10px 12px;
    overflow-x: auto;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    border-left: 4px solid #DA1F26;
    padding: 4px 14px;
    margin: 12px 0;
    color: #444;
    background: #fafafa;
  }
  hr { border: none; border-top: 1px solid #ddd; margin: 28px 0; }
  strong { color: #5E0B0F; }
  a { color: #0066cc; text-decoration: none; }
  /* keep tables and code blocks together on a page where possible */
  table, pre { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
</style>
"""

def convert(md_path, pdf_path):
    name = os.path.basename(md_path)
    print(f"  {name} ...", end=" ", flush=True)
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "toc"],
    )
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{name}</title>
  {CSS}
</head>
<body>
{html_body}
</body>
</html>
"""
    html_path = md_path.replace(".md", ".html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    # Print to PDF via Edge headless
    file_url = "file:///" + html_path.replace("\\", "/")
    result = subprocess.run(
        [
            EDGE,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={pdf_path}",
            file_url,
        ],
        capture_output=True,
        text=True,
        timeout=60,
    )
    if not os.path.exists(pdf_path):
        print("FAILED")
        print("STDERR:", result.stderr[:500])
        return False
    size_kb = os.path.getsize(pdf_path) // 1024
    print(f"OK ({size_kb} KB)")
    # Clean up intermediate HTML
    os.remove(html_path)
    return True

if __name__ == "__main__":
    for src, dst in [
        ("BRD-Lean.md", "BRD-Lean.pdf"),
        ("BRD-Full.md", "BRD-Full.pdf"),
    ]:
        src_p = os.path.join(DOCS, src)
        dst_p = os.path.join(DOCS, dst)
        convert(src_p, dst_p)
