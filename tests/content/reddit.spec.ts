import {selectLocatorHelper, SiteConfig, testSite} from "./contentHelpers";

const siteConfig: SiteConfig = {
  name: "Reddit",
  url: "file://" +__dirname + "/pages/Reddit.html",
  locators_to_check_filtered: [
    (page) => page.locator('shreddit-post').filter({ hasText: 'u/Pennsyltuckey54 • 22 hr. ago Report What is the smallest hill you’ll die on? U' }).getByRole('link').first(),
    (page) => page.locator('shreddit-post').filter({ hasText: 'u/RealisticChildhood80 • 14 hr. ago Report What\'s the strangest fact you know th' }).getByRole('link').first(),
  ],
  locators_to_check_not_filtered: [
    (page) => page.locator('shreddit-post').filter({ hasText: 'u/Ankit1000 • 5 hr. ago Report Naan bread, Chai Tea, what are the other redundan' }).getByRole('link').first(),
    (page) => page.locator('shreddit-post').filter({ hasText: 'u/The-Sonne • 21 hr. ago Report What\'s a situation or condition that nobody unde' }).getByRole('link').first(),
  ],
  words_to_filter: [
    "smallest",
    "RealisticChildhood80",
  ]
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);


