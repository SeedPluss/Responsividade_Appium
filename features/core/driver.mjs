import {remote} from "webdriverio";
import {} from '@wdio/globals';


export async function inicializar(){
  const capabilities = {
    "platformName": "Android",
    "appium:deviceName": "Automacao",
    "appium:automationName": "uiautomator2",
    "appium:appPackage": "br.com.confesol.ib.cresol",
    "appium:appActivity": "br.com.confesol.ib.cresol.MainActivity"
  }
  
  const wdOpts = {
    hostname: process.env.APPIUM_HOST || '127.0.0.1',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    logLevel: 'info',
    capabilities,
  };
  const driver = await remote(wdOpts);
  return driver;

}

export async function setarApp(driver){
  const el1 = await driver.getElementById("00000000-0000-00fa-ffff-ffff000002c3");
  await el1.click();
  const el2 = await driver.getElementById("00000000-0000-00fa-ffff-ffff000002c2");
  await el2.click();
  const el3 = await driver.getElementById("00000000-0000-00fa-ffff-ffff000002c2");
  await el3.click();
  const el4 = await driver.getElementByXpath("//android.widget.Button[@text='Agora não']");
  await el4.click();
  const el5 = await driver.getElementById("00000000-0000-00f9-0000-000500000006");
  for (let i = 0; i == 10; i++) {
    await el5.click();
  }

  const el21 = await driver.getElementByClass("android.widget.EditText");
  await el21.addValue("18081988");
  const el22 = await driver.getElementById("00000000-0000-00f9-0000-008900000006");
  await el22.click();
  const el23 = await driver.getElementById("00000000-0000-00f9-0000-00aa00000006");
  await el23.click();
  const el24 = await driver.getElementById("00000000-0000-00f9-0000-00fb00000006");
  await el24.click();
  const el25 = await driver.getElementById("00000000-0000-00f9-0000-00e200000006");
  await el25.click();
}

export default {
  inicializar,
  setarApp
};


