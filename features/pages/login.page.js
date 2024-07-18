import { inicializar, setarApp } from "../core/driver.mjs";
import { BeforeAll, Given, When, Then, After } from '@cucumber/cucumber';
var driver = await inicializar(driver);

BeforeAll({timeout: 30000},async() =>{
})

After(async() => {

});

Given ('Eu estou na tela de login', {timeout: 30000}, async () => {
  setarApp();
  const el26 = await driver.$("-android uiautomator:new UiSelector().text(\"Acesse a sua conta\")");
  await el26.click();
  });
  
When ('Eu preencho os dados de Login', async () => {
    const el1 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(0)");
    await el1.addValue("02799760031");
    const el3 = await driver.$("-android uiautomator:new UiSelector().className(\"android.widget.EditText\").instance(1)");
    await el3.addValue("teste123");
});
  

Then ('Clico no botão de logar', {timeout: 2000}, async () => {
    const el4 = await driver.$("-android uiautomator:new UiSelector().text(\"Acesse sua conta\")");
    await el4.click();

});

