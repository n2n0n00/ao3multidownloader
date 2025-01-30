const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

(async () => {
  const AO3_URL = "https://archiveofourown.org";
  const BOOKMARKS_URL =
    "https://archiveofourown.org/users/your_username/bookmarks"; //copy paste here your bookmarks url or username
  const DOWNLOAD_PATH = path.join(process.cwd(), "downloads");

  if (!fs.existsSync(DOWNLOAD_PATH)) {
    fs.mkdirSync(DOWNLOAD_PATH, { recursive: true });
  }

  let browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  let page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOAD_PATH,
  });

  console.log("Opening AO3...");
  await page.goto(AO3_URL, { waitUntil: "networkidle2" });
  console.log("Please log in manually, then press Enter in the terminal.");
  await new Promise((resolve) => process.stdin.once("data", resolve));

  let currentPage = BOOKMARKS_URL;
  let ficLinks = [];

  while (currentPage) {
    try {
      console.log(`🔎 Fetching bookmarks from: ${currentPage}`);
      await page.goto(currentPage, { waitUntil: "networkidle2" });

      const selectors = [
        "li.bookmark div.header.module h4 a:nth-child(1)",
        "h4.heading a[href^='/works/']",
      ];

      let pageFicLinks = [];
      for (const selector of selectors) {
        pageFicLinks = await page
          .$$eval(selector, (links) => {
            return links.map(
              (a) => "https://archiveofourown.org" + a.getAttribute("href")
            );
          })
          .catch(() => []);
        if (pageFicLinks.length > 0) break;
      }

      ficLinks = ficLinks.concat(pageFicLinks);

      currentPage = await page.evaluate(() => {
        const nextLink = document.querySelector("ol.pagination li.next a");
        return nextLink ? nextLink.href : null;
      });
    } catch (error) {
      console.error("Error fetching bookmark page:", error);
      break;
    }
  }

  console.log(`✅ Found ${ficLinks.length} total fics. Starting downloads...`);

  for (let i = 0; i < ficLinks.length; i++) {
    const ficUrl = ficLinks[i];
    console.log(`📥 (${i + 1}/${ficLinks.length}) Visiting: ${ficUrl}`);

    try {
      const ficPage = await browser.newPage();
      const ficClient = await ficPage.target().createCDPSession();
      await ficClient.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: DOWNLOAD_PATH,
      });

      // Get the initial list of files in the directory
      const initialFiles = new Set(fs.readdirSync(DOWNLOAD_PATH));

      await ficPage.goto(ficUrl, { waitUntil: "networkidle2" });

      const workTitle = await ficPage
        .$eval("h2.title.heading", (el) => el.textContent.trim())
        .catch(() => "Untitled");
      const relationshipTag = await ficPage
        .$eval("#main dd.relationship.tags ul li a", (el) =>
          el.textContent.trim()
        )
        .catch(() => "");
      const formattedTitle = relationshipTag
        ? `${workTitle} (${relationshipTag})`
        : workTitle;

      // Clean the title for use as a filename
      const safeTitle = formattedTitle
        .replace(/[/\\?%*:|"<>]/g, "-") // Replace invalid filename characters
        .replace(/\s+/g, "_") // Replace spaces with underscores
        .substring(0, 200); // Limit filename length

      console.log("Found work title:", workTitle);
      console.log("Found relationship tag:", relationshipTag);

      const downloadButton = await ficPage
        .waitForSelector("li.download > a", { visible: true, timeout: 10000 })
        .catch(() => null);
      if (!downloadButton) {
        console.log("Download button not found!");
        await ficPage.close();
        continue;
      }
      await downloadButton.click();

      const epubSelector = "li.download ul li:nth-child(2) a";
      const epubLink = await ficPage
        .waitForSelector(epubSelector, { timeout: 5000 })
        .catch(() => null);
      if (!epubLink) {
        console.log("EPUB link not found!");
        await ficPage.close();
        continue;
      }

      console.log(`📂 Starting download for: ${formattedTitle}`);
      await epubLink.click();

      // Wait for download to finish and then rename
      await new Promise((resolve) => {
        const checkDownload = setInterval(() => {
          const currentFiles = fs.readdirSync(DOWNLOAD_PATH);
          // Find new file that wasn't in the initial file list
          const newFile = currentFiles.find(
            (file) => !initialFiles.has(file) && file.endsWith(".epub")
          );

          if (newFile) {
            const oldPath = path.join(DOWNLOAD_PATH, newFile);
            const newPath = path.join(DOWNLOAD_PATH, `${safeTitle}.epub`);

            try {
              fs.renameSync(oldPath, newPath);
              console.log(`✅ Successfully renamed to: ${safeTitle}.epub`);
              clearInterval(checkDownload);
              resolve();
            } catch (error) {
              if (!error.message.includes("EBUSY")) {
                console.error("Error renaming file:", error);
                clearInterval(checkDownload);
                resolve();
              }
            }
          }
        }, 1000);
      });

      await ficPage.close();
    } catch (error) {
      console.error(`Error processing fic ${ficUrl}:`, error);
      continue;
    }
  }

  console.log("🎉 All fics downloaded!");
  await browser.close();
})();
