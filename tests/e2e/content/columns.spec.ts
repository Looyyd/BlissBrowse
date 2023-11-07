import {selectLocatorHelper, SiteConfig, testSite} from "./contentHelpers";

const siteConfig: SiteConfig = {
  name: "Columns",
  url: "file://" +__dirname + "/pages/columns.html",
  locators_to_check_filtered: [
    //has id "#trigger"
    (page) => page.locator("#trigger"),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByText('cccc'),
    (page) => page.getByText('eeee').first()
  ],
  words_to_filter: [
    "trigger",
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);


