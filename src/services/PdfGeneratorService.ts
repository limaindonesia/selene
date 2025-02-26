import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';

const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

export class PdfGeneratorService {
  /**
   * Generate a PDF from HTML content
   * @param html HTML content
   * @param outputPath Output file path (optional)
   * @returns Path to the generated PDF file
   */
  async generatePdf(html: string, outputPath?: string): Promise<string> {
    let browser;
    try {
      if (!outputPath) {
        const tempDir = path.join(os.tmpdir(), 'pdf-generator');
        await mkdirAsync(tempDir, { recursive: true });
        outputPath = path.join(tempDir, `${Date.now()}.pdf`);
      } else {
        const dir = path.dirname(outputPath);
        await mkdirAsync(dir, { recursive: true });
      }

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      return outputPath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate a PDF from a URL
   * @param url URL to generate PDF from
   * @param outputPath Output file path (optional)
   * @returns Path to the generated PDF file
   */
  async generatePdfFromUrl(url: string, outputPath?: string): Promise<string> {
    let browser;
    try {
      if (!outputPath) {
        const tempDir = path.join(os.tmpdir(), 'pdf-generator');
        await mkdirAsync(tempDir, { recursive: true });
        outputPath = path.join(tempDir, `${Date.now()}.pdf`);
      } else {
        // Ensure the directory exists
        const dir = path.dirname(outputPath);
        await mkdirAsync(dir, { recursive: true });
      }

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm',
        },
      });

      return outputPath;
    } catch (error) {
      console.error('Error generating PDF from URL:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
