const fs = require("fs");
const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });

  const page = await browser.newPage();
  await page.goto("https://discord.band/tags", { waitUntil: "networkidle2" });

  let output = [];
  let pageNumber = 1;

  while (true) {
    console.log(`📄 Scraping Page ${pageNumber}...`);
    await page.waitForTimeout(2000);

    const tagsOnPage = await page.evaluate(() => {
      const cards = document.querySelectorAll("div[class*='TagList'] > div");
      const blocks = [];

      cards.forEach(card => {
        try {
          const tagName = card.querySelector("div > div > div > div:nth-child(1)").innerText.trim();
          const img = card.querySelector("div > div > div > div:nth-child(1) img");
          const link = card.querySelector("a[href*='join']");

          if (!img || !img.src.includes("cdn.discordapp.com")) return;

          blocks.push({
            name: `> Tag: \`${tagName}\``,
            link: link?.href || "N/A",
            attachment: img.src,
          });
        } catch (err) {
          console.error("❌ Error scraping a tag:", err);
        }
      });

      return blocks;
    });

    output = output.concat(tagsOnPage);

    const nextBtn = await page.$("button[aria-label='Go to next page']");
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
      pageNumber++;
    } else {
      console.log("✅ No more pages.");
      break;
    }
  }

  const formatted = output.map(o => JSON.stringify(o, null, 2)).join(",\n");
  fs.writeFileSync("DBoutput.txt", formatted, "utf-8");
  console.log(`📁 Saved ${output.length} entries to DBoutput.txt`);

  await browser.close();
})();
