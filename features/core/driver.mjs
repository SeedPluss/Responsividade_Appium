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
  const allowLocalizao = await driver.$("id:com.android.permissioncontroller:id/permission_allow_foreground_only_button");
  await allowLocalizao.click();
  const allowContatos = await driver.$("id:com.android.permissioncontroller:id/permission_allow_button");
  await allowContatos.click();
  const allowChamadas = await driver.$("id:com.android.permissioncontroller:id/permission_allow_button");
  await allowChamadas.click();
  const negarSms = await driver.$("//android.widget.Button[@text='Agora não']");
  await negarSms.click();
  const logo = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.TextView\").instance(0)");
  for (let numloop = 0; numloop <= 10; numloop++) {
    await logo.click();
  }
  const senhaAmbiente = await driver.$("class name:android.widget.EditText");
  await senhaAmbiente.addValue("18081988");
  const confirmasenhaAmbiente = await driver.$("-android uiautomator:new UiSelector().text(\"Confirmar\")");
  await confirmasenhaAmbiente.click();
  const selecionaHml = await driver.$("//android.app.Dialog/android.view.View/android.view.View/android.view.View/android.view.View[3]/android.view.View[1]/android.widget.Image");
  await selecionaHml.waitForDisplayed({ timeout: 30000 })
  await selecionaHml.click();
  const allowAnalitycs = await driver.$("//android.app.Dialog/android.view.View/android.view.View/android.view.View/android.view.View[7]/android.view.View/android.widget.Button");
  await allowAnalitycs.click();
  const confirmaselecaoAmbiente = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.Image\").instance(6)");
  await confirmaselecaoAmbiente.click();
  const acessesuaConta = await driver.$("-android uiautomator:new UiSelector().text(\"Acesse a sua conta\")");
  await acessesuaConta.click();
}

export default {
  inicializar,
  setarApp
};


