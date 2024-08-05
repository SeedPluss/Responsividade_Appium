import { inicializar, setarApp } from "../../core/driver.mjs";
import loginPage, * as login from "../../pages/login.page.mjs";
import { BeforeAll, Given, When, Then, After } from '@cucumber/cucumber';
var driver = await inicializar(driver);

BeforeAll({timeout: 30000},async() =>{
  setarApp(driver);
})

After(async() => {
});


Given('Eu estou na tela de login', async () => {
    
});
  
When('Eu preencho os dados de Login',{timeout: 30000}, async () => {
    loginPage.preencherloginPf('02799760031', '963214')
});

Then('Clico no botão de logar', {timeout: 2000}, async () => {
    const botaoLogar = await driver.$('//android.widget.Button[@text="Acesse sua conta"]');
    await botaoLogar.click();

});

