import {inicializar} from "../core/driver.mjs";
import {} from '@wdio/globals';


class LoginPage{

    get inputCpf(){
        return $('//android.webkit.WebView[@text="CresolApp"]/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View[4]/android.view.View/android.view.View[1]/android.view.View/android.view.View/android.widget.EditText');
    }
    
    get inputSenha(){
        return $('//android.webkit.WebView[@text="CresolApp"]/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View[4]/android.view.View/android.view.View[2]/android.view.View[1]/android.view.View/android.widget.EditText');
    }

    async preencherloginPf(cpf, senha){
        await this.inputCpf.waitForDisplayed({ timeout: 30000 })
        await this.inputCpf.click();
        await this.inputCpf.setValue(cpf);
        await this.inputSenha.click();
        await this.inputSenha.setValue(senha);
    }
}


export default new LoginPage();

