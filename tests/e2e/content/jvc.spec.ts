import {SiteConfig, testSite, selectLocatorHelper} from "./contentHelpers";
import {headless} from "../fixtures";


const siteConfig: SiteConfig = {
  name: "JVC",
  url: "file://" +__dirname + "/pages/JVC.html",
  locators_to_check_filtered: [
    (page) => page.getByRole('link', { name: 'propriodesco' }),
    (page) => page.getByRole('link', { name: 'La TEMPETE du SIECLE demain et tout le monde s\'en BRANLE' }),
    (page) => page.getByRole('link', { name: 'Boule blanche dans la mozzarella ?' }),
  ],
  locators_to_check_not_filtered: [
    (page) => page.getByRole('link', { name: 'La meilleurs couverture d\'album de TINTIN ?' }),
    (page) => page.getByRole('link', { name: 'ImAbove' }),
    (page) => page.getByRole('link', { name: 'NOFAKE j\'ai BAISÉ SHAKIRA à PARIS en 2005' }),
  ],
  words_to_filter: [
    "propriodesco",
    "boule",
  ],
  setup_actions:   headless ?  undefined: async (page) => await page.getByRole('button', { name: 'J\'accepte' }).click(),
};

//selectLocatorHelper(siteConfig);
testSite(siteConfig);
