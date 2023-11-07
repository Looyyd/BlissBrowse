import {selectLocatorHelper, SiteConfig, testSite} from "./contentHelpers";

const siteConfig: SiteConfig = {
  name: "Hashtags",
  url: "file://" +__dirname + "/pages/hashtags.html",
  locators_to_check_filtered: [
    //has id "#trigger"
    (page) => page.locator("#trigger"),
    (page) => page.locator("#trigger-element"),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByText('Text with no hashtags'),
  ],
  words_to_filter: [
    "trigger",
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);


