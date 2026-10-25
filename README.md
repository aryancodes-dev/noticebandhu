# NoticeBandhu — College Notice, Made Simple
🔗 **Live Site:** https://aryancodes-dev.github.io/noticebandhu/


Colleges send long, dense English notices on WhatsApp as PDFs/photos.
First-generation students — and their parents, who must pay the fees or
sign — often can't decode: **What is it? Last date? How much? Who must act?**
Missing an exam-form or scholarship notice can cost a semester.

NoticeBandhu v1 answers those 4 questions from pasted notice text, in
simple words, with a parent audio button and a WhatsApp-ready message.

## What v1 does
- Paste notice text (or tap a sample: Exam Form, Fee Due, Scholarship)
- Extracts: **category, what, last date (+ days left), fees, who must act**
- Simple English summary + Bengali/Hindi template summaries for common
  notice types, with the real date and fee from *your* notice filled in
- **Play Audio** — uses the device's built-in speech (free, no server,
  no recording). Play on speaker for a parent, or screen-record to forward
- **Copy WhatsApp message** — one tap, ready to forward

## What v1 honestly does NOT do (v2)
- **Photo/PDF reading (OCR):** needs an OCR service — not faked here.
  Paste the text, or copy it from the PDF, for v1.
- **Full automatic translation of any notice:** needs a translation API.
  v1 uses fixed templates for exam-form / fee / scholarship notices, plus
  a generic template for other notices, with real dates/fees filled in.

## Run it
Open `index.html` in any browser, or:
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Test the extraction logic (Node, no browser needed)
```bash
node -e "
const {analyzeNotice, simpleSummary} = require('./app.js');
const n = 'All BCA students: Exam form last date is 15/11/2026. Fee Rs. 1200/-.';
console.log(analyzeNotice(n));
console.log(simpleSummary(analyzeNotice(n)));
"
```

## Roadmap
- v2: Photo/PDF upload via OCR + translation API (needs a free API key)
- v3: Deadline reminders, saved notices, calendar export

## Tech
HTML/CSS/JavaScript only · No dependencies, no API key, no server · MIT License

Made by Aryan Kumar Shah · BCA, MAKAUT
