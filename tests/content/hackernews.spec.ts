import {SiteConfig, testSite} from "./contentHelpers";



const siteConfig: SiteConfig = {
  name: "Hacker News",
  url: "file://" +__dirname + "/pages/Hacker News.html",
  locators_to_check_filtered: [
    (page) => page.getByRole('link', {name: 'German court declares Do Not Track to be legally binding'}),
  ],
  words_to_filter: [
    "german"
  ]
};

testSite(siteConfig);