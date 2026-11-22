import { DOMParser, onErrorStopParsing } from "@xmldom/xmldom";
import JSZip from "jszip";
import * as mammoth from "mammoth";
import path from "path";
import { extractText, getDocumentProxy, getMeta } from "unpdf";

export interface ParsedDocument {
  text: string;
  pages: number;
  title?: string;
  metadata?: Record<string, unknown>;
}

export class DocParser {
  async parse(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    switch (path.extname(filename).toLowerCase()) {
      case ".pdf":
        return this.parsePdf(buffer);
      case ".docx":
        return this.parseDocx(buffer);
      case ".txt":
        return this.parseTxt(buffer);
      case ".md":
      case ".markdown":
        return this.parseMarkdown(buffer);
      default:
        throw new Error("Unsupported document extension.");
    }
  }

  async parsePdf(buffer: Buffer): Promise<ParsedDocument> {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    try {
      const { text, totalPages } = await extractText(pdf, { mergePages: true });
      const { info } = await getMeta(pdf);
      const title = typeof info.Title === "string" ? info.Title : undefined;

      return {
        text,
        pages: totalPages,
        ...(title ? { title } : {}),
        metadata: info,
      };
    } finally {
      await pdf.destroy();
    }
  }

  async parseDocx(buffer: Buffer): Promise<ParsedDocument> {
    const [result, zip] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      JSZip.loadAsync(buffer),
    ]);
    const errors = result.messages.filter(
      (message) => message.type === "error",
    );
    if (errors.length > 0) {
      throw new Error(errors.map((error) => error.message).join("; "));
    }

    const xmlParser = new DOMParser({ onError: onErrorStopParsing });
    const appProperties = zip.file("docProps/app.xml");
    const coreProperties = zip.file("docProps/core.xml");
    let pages = 0;
    let title: string | undefined;

    if (appProperties) {
      const xml = xmlParser.parseFromString(
        await appProperties.async("string"),
        "application/xml",
      );
      const pageText = xml
        .getElementsByTagNameNS(
          "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties",
          "Pages",
        )
        .item(0)
        ?.textContent?.trim();
      if (pageText) {
        pages = Number(pageText);
        if (!/^\d+$/.test(pageText) || !Number.isSafeInteger(pages)) {
          throw new Error("Invalid DOCX page count.");
        }
      }
    }

    if (coreProperties) {
      const xml = xmlParser.parseFromString(
        await coreProperties.async("string"),
        "application/xml",
      );
      title = xml
        .getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "title")
        .item(0)
        ?.textContent?.trim();
    }

    return {
      text: result.value,
      pages,
      ...(title ? { title } : {}),
      ...(result.messages.length > 0
        ? { metadata: { messages: result.messages } }
        : {}),
    };
  }

  parseTxt(buffer: Buffer): ParsedDocument {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(buffer),
      pages: 0,
    };
  }

  parseMarkdown(buffer: Buffer): ParsedDocument {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(buffer),
      pages: 0,
    };
  }

  public cleanText(text: string): string {
    return text
      .normalize("NFC")
      .replace(/\r\n?|\u0085|\u2028/g, "\n")
      .replace(/\f|\u2029/g, "\n\n")
      .replace(
        /[\u0000-\u0008\u000B\u000E-\u001F\u007F-\u009F\u00AD\uFEFF]/g,
        "",
      )
      .replace(/\n(?:[ \t]*\n){2,}/g, "\n\n")
      .replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, "")
      .replace(/^[ \t]+$/, "");
  }
}
