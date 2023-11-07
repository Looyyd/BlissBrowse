import {selectLocatorHelper, SiteConfig, testSite} from "./contentHelpers";

const siteConfig: SiteConfig = {
  name: "Trigger smaller",
  url: "file://" +__dirname + "/pages/trigger_smaller.html",
  locators_to_check_filtered: [
    //has id "#trigger"
    (page) => page.locator("#trigger"),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByText('dddd'),
    (page) => page.getByText('gggg')
  ],
  words_to_filter: [
    "trigger",
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);


