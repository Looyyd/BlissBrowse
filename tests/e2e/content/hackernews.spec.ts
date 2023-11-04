import {SiteConfig, testSite} from "./contentHelpers";



const siteConfig: SiteConfig = {
  name: "Hacker News",
  url: "file://" +__dirname + "/pages/Hacker News.html",
  locators_to_check_filtered: [
    (page) => page.getByRole('link', {name: 'German court declares Do Not Track to be legally binding'}),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByRole('link', { name: 'Gmail, Yahoo announce new 2024 authentication requirements for bulk senders' }),
  ],
  words_to_filter: [
    "german"
  ]
};

testSite(siteConfig, true);