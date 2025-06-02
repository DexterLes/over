const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Launching browser...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  const baseUrl = "https://discord.band/tags";

  const output = [];
  let pageNumber = 1;

  while (true) {
    console.log(`📄 Scraping Page ${pageNumber}...`);
    await page.goto(`${baseUrl}?page=${pageNumber}`, { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);

    const cards = await page.$$("div[class*='TagList'] > div");

    if (cards.length === 0) {
      console.log("✅ No more cards, stopping.");
      break;
    }

    for (const card of cards) {
      try {
        const tagNameRaw = await card.$eval("div > div > div > div:nth-child(1)", el => el.innerText);
        const tagIconURL = await card.$eval("div > div > div > div:nth-child(1) img", img => img.src);
        const joinLink = await card.$eval("a[href*='join']", a => a.href);

        if (!tagIconURL.includes("cdn.discordapp.com")) {
          console.log(`⚠️ Skipped non-attachment icon for tag: ${tagNameRaw}`);
          continue;
        }

        output.push({
          name: `> Tag: \`${tagNameRaw.trim()}\``,
          link: joinLink,
          attachment: tagIconURL
        });

        console.log(`✅ ${tagNameRaw}`);
      } catch (err) {
        console.log(`❌ Failed to parse a tag: ${err.message}`);
      }
    }

    const hasNext = await page.$("button[aria-label='Go to next page']");
    if (!hasNext) break;

    await hasNext.click();
    await page.waitForTimeout(2000);
    pageNumber++;
  }

  const formatted = output.map(block => JSON.stringify(block, null, 2)).join(",\n");
  require("fs").writeFileSync("DBoutput.txt", formatted, "utf-8");
  console.log("📁 Done. Output saved to DBoutput.txt");

  await browser.close();
})();
