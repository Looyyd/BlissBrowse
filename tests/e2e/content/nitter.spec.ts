import {SiteConfig, testSite, selectLocatorHelper} from "./contentHelpers";



const siteConfig: SiteConfig = {
  name: "Nitter",
  url: "file://" +__dirname + "/pages/nitter.html",
  locators_to_check_filtered: [
    (page) => page.locator('div:nth-child(2) > .tweet-link'),
  ],
  locators_to_check_not_filtered: [
    (page) => page.locator('.tweet-link').first(),
    (page) => page.locator('div:nth-child(3) > .tweet-link'),
  ],
  words_to_filter: [
    'Rishi Sunak',
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);
