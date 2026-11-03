/*
 * Dandy
 * DO NOT FOR SALE!
 * Github: github.com/DanzzAraAra
 */

import axios from "axios";
import Form from "form-data";
import * as cheerio from "cheerio";

const ezgifDomain = "https://ezgif.com";
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

const ezgif = async ({ url, buffer, from, to }) => {
    try {
        const endpoint = `${ezgifDomain}/${from}-to-${to}`;
        const form = new Form();

        if (buffer) {
            form.append("new-image", Buffer.from(buffer), {
                filename: "sticker.webp"
            });
        } else if (url) {
            form.append("new-image-url", url);
        } else {
            throw new Error("Either buffer or URL must be provided");
        }

        const { data: uploadPage } = await axios.post(endpoint, form, {
            headers: {
                ...form.getHeaders(),
                "User-Agent": userAgent
            },
            timeout: 30000
        });

        const $ = cheerio.load(uploadPage);
        const fileId =
            $('input[name="file"]').val() ||
            $('input[type="hidden"][name*="file"]').first().val();

        if (!fileId) {
            throw new Error("Upload failed: no file ID found");
        }

        const convertForm = new Form();
        convertForm.append("file", fileId);
        convertForm.append("ajax", "true");

        if (to === "mp4") {
            convertForm.append("format", "mp4");
        }

        const { data: convertPage } = await axios.post(
            `${endpoint}/${fileId}`,
            convertForm,
            {
                headers: {
                    ...convertForm.getHeaders(),
                    "User-Agent": userAgent,
                    Referer: endpoint
                },
                timeout: 30000
            }
        );

        const $$ = cheerio.load(convertPage);
        let resultUrl;

        for (const selector of [
            ".outfile video source",
            ".outfile img",
            "video source",
            "img.outfile",
            "a[download]",
            "#output video source",
            "#output img"
        ]) {
            const element = $$(selector).first();

            if (!element.length) continue;

            resultUrl = element.attr("src") || element.attr("href");
            if (resultUrl) break;
        }

        if (!resultUrl) {
            resultUrl = convertPage.match(/"output":"([^"]+)"/)?.[1];
        }

        if (!resultUrl) {
            throw new Error("Conversion failed: no output URL found");
        }

        if (resultUrl.startsWith("//")) {
            resultUrl = `https:${resultUrl}`;
        } else if (resultUrl.startsWith("/")) {
            resultUrl = `${ezgifDomain}${resultUrl}`;
        } else if (!resultUrl.startsWith("http")) {
            resultUrl = `${ezgifDomain}/${resultUrl}`;
        }

        return resultUrl;
    } catch (error) {
        throw new Error(`EZGIF conversion failed: ${error.message}`);
    }
};

export { ezgif };