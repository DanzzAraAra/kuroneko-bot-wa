/*
   * Dandy
   * DO NOT FOR SALE!
   * Github: github.com/DanzzAraAra
*/
const axios = require("axios");
const Form = require("form-data");
const cheerio = require("cheerio");

const ezgifDomain = "https://ezgif.com";

async function ezgif({ url, buffer, from, to }) {
  try {
    const f1 = new Form();
    
    if (buffer) {
      f1.append("new-image", Buffer.from(buffer), { filename: "sticker.webp" });
    } else if (url) {
      f1.append("new-image-url", url);
    } else {
      throw new Error("Either buffer or URL must be provided");
    }
    const { data: uploadPage } = await axios.post(
      `${ezgifDomain}/${from}-to-${to}`,
      f1,
      {
        headers: {
          ...f1.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      }
    );

    const $ = cheerio.load(uploadPage);
    const file = $('input[name="file"]').val();
    
    if (!file) {
      const fileInput = $('input[type="hidden"]').filter((i, el) => {
        return $(el).attr('name') && $(el).attr('name').includes('file');
      });
      const altFile = fileInput.first().val();
      if (!altFile) {
        throw new Error("Upload failed: no file ID found.");
      }
    }

    const f2 = new Form();
    f2.append("file", file || altFile);
    f2.append("ajax", "true");
    
    if (to === "mp4") {
      f2.append("format", "mp4");
    }

    const { data: convertPage } = await axios.post(
      `${ezgifDomain}/${from}-to-${to}/${file || altFile}`,
      f2,
      {
        headers: {
          ...f2.getHeaders(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': `${ezgifDomain}/${from}-to-${to}`
        },
        timeout: 30000
      }
    );

    const $$ = cheerio.load(convertPage);
    
    let resultUrl = null;
    
    const selectors = [
      '.outfile video source',
      '.outfile img',
      'video source',
      'img.outfile',
      'a[download]',
      '#output video source',
      '#output img'
    ];
    
    for (const selector of selectors) {
      const element = $$(selector);
      if (element.length > 0) {
        if (selector.includes('source')) {
          resultUrl = element.attr('src');
        } else if (selector.includes('img')) {
          resultUrl = element.attr('src');
        } else if (selector.includes('a[download]')) {
          resultUrl = element.attr('href');
        }
        
        if (resultUrl) break;
      }
    }

    if (!resultUrl) {
      const match = convertPage.match(/"output":"([^"]+)"/);
      if (match) {
        resultUrl = match[1];
      }
    }

    if (!resultUrl) {
      throw new Error("Conversion failed: no output URL found in page.");
    }

    if (resultUrl.startsWith("//")) {
      resultUrl = "https:" + resultUrl;
    } else if (resultUrl.startsWith("/")) {
      resultUrl = ezgifDomain + resultUrl;
    } else if (!resultUrl.startsWith("http")) {
      resultUrl = ezgifDomain + "/" + resultUrl;
    }

    console.log(`Conversion successful: ${resultUrl}`);
    return resultUrl;
    
  } catch (err) {
    console.error(`[EZGIF] convert ${from} → ${to} failed:`, err.message);
    throw new Error(`EZGIF conversion failed: ${err.message}`);
  }
}

module.exports = { ezgif };