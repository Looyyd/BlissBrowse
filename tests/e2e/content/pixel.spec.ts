import {selectLocatorHelper, SiteConfig, testSite} from "./contentHelpers";

const siteConfig: SiteConfig = {
  name: "Trigger smaller",
  url: "file://" +__dirname + "/pages/trigger_smaller.html",
  locators_to_check_filtered: [
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByText('dddd'),
    (page) => page.getByText('aaaa'),
    (page) => page.getByText('bbbb'),
    (page) => page.getByText('cccc')
  ],
  words_to_filter: [
    "trigger",
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);



