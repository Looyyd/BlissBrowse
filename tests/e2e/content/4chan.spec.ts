import {SiteConfig, testSite, selectLocatorHelper} from "./contentHelpers";



const siteConfig: SiteConfig = {
  name: "4chan",
  url: "file://" +__dirname + "/pages/4chan.html",
  locators_to_check_filtered: [
    (page) => page.getByText('why did he smoke meth in the books but not in the show?'),
    (page) => page.locator('#thread-191581152').getByRole('link').first(),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByText('Would you pay to watch this on the big screen'),
    (page) => page.locator('#thread-191581780').getByRole('link').first(),
  ],
  words_to_filter: [
    "meth"
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);

