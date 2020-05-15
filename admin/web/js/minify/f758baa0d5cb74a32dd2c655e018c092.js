class MylsLocalization{constructor(translate){this.translate=translate;this.mode='development';}
async getTranslate(){let translate=await app.processData("site/loadtranslate","post");DevExpress.localization.loadMessages(translate);if(translate!=''){this.translate=translate;}}
saveString(str){if(!str)return'';str=str.trim();if(str!=''){let hash=CryptoJS.MD5(str.toLowerCase());$.each(this.translate,(index,item)=>{if(!item.hasOwnProperty(hash)){item[hash]=str;}});return this.translate[app.config.lang][hash];}
return'';}
saveTranslateColumns(columns){let self=this;$.each(columns,(_,col)=>{$.each(col.columns,(index,item)=>{if(item.caption!=''){item.caption=self.saveString(item.caption);}});});DevExpress.localization.loadMessages(this.translate);}
saveTranslateTableInfo(table){let self=this;$.each(table,function(_,info){if(typeof info==='object'&&info.hasOwnProperty('name')&&info.name!=''){info.name=self.saveString(info.name);}});DevExpress.localization.loadMessages(this.translate);}
saveTranslateContextMenu(menus){let self=this;$.each(menus,function(_,menu){$.each(menu,function(index,item){if(item.text!=''){item.text=self.saveString(item.text);}
if(item.title!=''){item.title=self.saveString(item.title);}});});DevExpress.localization.loadMessages(this.translate);}
saveTranslateMenu(menu){let self=this;$.each(menu,function(index,item){item.key=self.saveString(item.key);if(item.items.length>0){$.each(item.items,function(i,el){if(el.text!=''){el.text=self.saveString(el.text);}
if(el.title!=''){el.title=self.saveString(el.title);}});}});DevExpress.localization.loadMessages(this.translate);}
saveTranslateForm(form){for(var key in form){if(form[key].hasOwnProperty('label')){if(form[key].label['text']!=''){form[key].label['text']=this.saveString(form[key].label['text']);}}
if(form[key].hasOwnProperty('caption')){if(form[key].caption!=''){form[key].caption=this.saveString(form[key].caption);}}
if(form[key].hasOwnProperty('editorOptions')&&form[key].editorOptions.hasOwnProperty('text')){if(form[key].editorOptions.text!=''){form[key].editorOptions.text=this.saveString(form[key].editorOptions.text);}}
if(form[key].hasOwnProperty('placeholder')){if(form[key].caption!=''){form[key].caption=this.saveString(form[key].placeholder);}}}
DevExpress.localization.loadMessages(this.translate);}
saveTranslateBlock(template){const self=this;$('[role=caption], [role=postcaption]',$(template)).each(function(i,el){if($(el).text()!=''){let str=self.saveString($(el).text());$(el).text(str);}});DevExpress.localization.loadMessages(this.translate);}
saveFileTranslate(){if(this.mode=='development'){app.processData("site/savetranslate",'post',{data:this.translate});}}
async changeLocale(data){app.config.lang=data;app.allowSaveSetting=true;await app.saveSettings();window.location.href='/';}
async changeLocaleForm(data){app.config.lang=data;app.allowSaveSetting=true;await app.saveSettings();DevExpress.localization.locale(app.config.lang);auth.changeLocaleForm();}
setLocale(locale){app.config.lang=locale;app.saveSettings();}
destroy(){app.destroyArray(this.translate);}};;class AppCore{constructor(){this.config={lang:'en',company_id:1};this.allowSaveSetting=false;this.translate=new MylsLocalization();}
processData(url,method,data){if(data===null||data===undefined)data='';try{return new Promise((resolve,reject)=>{$.ajax({url:url,method:method,data:(data),success:function(result){if(result){result=$.parseJSON(result);if(result.error&&result.error!=''){reject(result);}else{resolve(result);}}},error:function(object,type,error){console.log(error);reject(error);}});});}catch(e){return Promise.reject(e.message);}}
async getSettings(){let setting=await this.processData('site/settings','POST',null);this.config=setting;this.config.lang=this.config.lang?this.config.lang:"en";this.config.company_id=this.config.company_id?this.config.company_id:1;this.config.client_id=this.config.client_id?this.config.client_id:null;DevExpress.localization.locale(this.config.lang);}
setSettings(){this.allowSaveSetting=true;}
saveSettings(){if(this.allowSaveSetting){this.allowSaveSetting=false;if('bottomTabs'in app){this.config.popups=[];for(let item of app.bottomTabs.panelContent){if(this.parseUrl(item.idn).ext_id!==-1){this.config.popups.push({idn:item.idn,tHistory:JSON.stringify(item.mylsObject.tHistory),id:item.mylsObject.table});}}}
this.processData('site/settings','POST',{'data':this.config});}}
getUrlParameter(name){name=name.replace(/[\[]/,'\\[').replace(/[\]]/,'\\]');var regex=new RegExp('[\\?&]'+name+'=([^&#]*)');var results=regex.exec(location.href);return results===null?'':decodeURIComponent(results[1].replace(/\+/g,'    '));}
parseUrl(url){const grid=url.replace(/#/g,'');const arrurl=grid.split(/\-|\_/);const type=arrurl[0];const table=arrurl[1];let ext_id=arrurl[2];let objView=arrurl[3];if(arrurl[2]=='popup'||arrurl[2]=='tab'){ext_id='';objView=arrurl[2];}else{ext_id=arrurl[2];}
if(arrurl[2]==''&&arrurl[3]==1){ext_id=-1;objView=arrurl[4];}
return{type,table,ext_id,objView};}
create_UUID(){let dt=new Date().getTime();let uuid='gxxxxxxxx'.replace(/[xy]/g,function(c){const r=(dt+Math.random()*16)%16|0;dt=Math.floor(dt / 16);return(c=='x'?r:(r&0x3|0x8)).toString(16);});return uuid;}};;class Auth{constructor(page){this.page=page;this.userData={};this.token='';this.formIdn='';switch(this.page){case'login':this.formIdn='mylsAuthForm';break;case'registration':this.formIdn='mylsRegistrationForm';break;case'restore':this.formIdn='mylsRestoreForm';this.token=app.getUrlParameter('token');if(this.token){$('#form-container').attr('action','restore?token='+this.token);}
break;}}
getUserData(token){this.userData=app.processData('site/regurl-decode','POST',{token:token});}
checkUserMail(email){return app.processData('site/checkuser','POST',{email:email});}
createForm(){let userName=$.cookie('userName');userName=(userName!=null)?userName:'';this.formData={};switch(this.page){case'login':this.formData={"username":userName,"password":"","rememberMe":false};break;case'registration':this.formData={"name":this.userData.name,"surname":this.userData.surname,"email":this.userData.email,"phone":"","password":"","company_id":this.userData.company_id,};$('#company_id').val(this.userData.company_id);break;case'restore':this.formData={"email":userName,"password":"","re=password":""};break;}
this.createObject();}
createObject(){$("#"+this.formIdn).dxForm({formData:this.formData,readOnly:false,showColonAfterLabel:true,showValidationSummary:false,validationGroup:"customerData",labelLocation:"top",items:this.getFormItems(),}).dxForm("instance");}
async initForm(){if(window.location.hash!==''){localStorage.setItem('currentHash',window.location.hash);}
let funcPromice=[app.translate.getTranslate(),app.getSettings()];if(this.page=='registration'){let token=app.getUrlParameter('token');if(!token){window.location.href='login';}
funcPromice.push(this.getUserData(token));}
Promise.all(funcPromice).then(()=>{this.createForm();app.translate.saveFileTranslate();});}
getFormItems(){this.formItems=[];let btnText="Войти";if(this.page=='login'){this.formItems.push({itemType:"group",items:[this.getUserName(),this.getPassword()]});}
if(this.page=='registration'){this.formItems.push({itemType:"group",items:[this.getName(),this.getSurname(),this.getEmail(),this.getPhone(),this.getPassword(),this.getRePassword()]});btnText="Зарегистрироваться";}
if(this.page=='restore'){let mailItems=[this.getEmail()];let passwItems=[this.getPassword(),this.getRePassword()];let items=mailItems;if(this.token){items=passwItems;}
this.formItems.push({itemType:"group",items:items});btnText="Отправить";}
this.formItems.push({itemType:"group",items:this.getLangItems()});this.formItems.push({itemType:"button",horizontalAlignment:"center",buttonOptions:{text:app.translate.saveString(btnText),type:"success",stylingMode:'outlined',useSubmitBehavior:true}});return this.formItems;}
getUserName(){return{dataField:"username",label:{text:app.translate.saveString("Имя пользователя"),},editorOptions:{stylingMode:"underlined"},validationRules:[{type:"required",}],}}
getPassword(){return{dataField:"password",label:{text:app.translate.saveString("Пароль"),},editorOptions:{mode:"password",stylingMode:"underlined"},validationRules:[{type:"required",}]}}
getName(){return{dataField:"name",label:{text:app.translate.saveString("Имя"),},editorOptions:{stylingMode:"underlined"},validationRules:[{type:"required",message:"Name is required"}]}}
getSurname(){return{dataField:"surname",label:{text:app.translate.saveString("Фамилия"),},editorOptions:{stylingMode:"underlined"},validationRules:[{type:"required",message:"Family is required"}]}}
getEmail(){const self=this;return{dataField:"email",label:{text:app.translate.saveString("Email"),},editorOptions:{stylingMode:"underlined"},validationRules:[{type:"required",message:"Email is required"},{type:"email",message:"Email is invalid"},{type:"async",message:"Email is already registered",validationCallback:function(params){return self.checkUserMail(params.value);}}]}}
getPhone(){return{dataField:"phone",label:{text:app.translate.saveString("Телефон"),},editorOptions:{stylingMode:"underlined"},}}
getRePassword(){const self=this;return{label:{text:app.translate.saveString("Повторите Пароль"),},editorType:"dxTextBox",editorOptions:{mode:"password",stylingMode:"underlined"},validationRules:[{type:"required",message:"Confirm Password is required"},{type:"compare",message:"'Password' and 'Confirm Password' do not match",comparisonTarget:function(){return $("#"+self.formIdn).dxForm('instance').option("formData").password;}}]}}
getLangItems(){let langItems=[];if(this.page=='login'){langItems.push(this.getRememberMe());}else{langItems.push(this.getLinkAuth());}
langItems.push(this.getLanguages());if(this.page=='login'){langItems.push(this.getLinkRestore());}
return[{itemType:'group',colCount:3,items:langItems}];}
getRememberMe(){return{colSpan:2,dataField:"rememberMe",editorType:'dxCheckBox',label:{visible:false},editorOptions:{text:app.translate.saveString("Запомнить меня"),onValueChanged:function(data){console.log(data.value);},},}}
getLinkAuth(){return{colSpan:2,dataField:"auth",label:{visible:false},editorOptions:{text:app.translate.saveString("Авторизация"),},template:function(data){return'<a href="login" title="'+app.translate.saveString("Войти")+'">'+app.translate.saveString("Войти")+'</a>';}}}
getLanguages(){return{cssClass:'myls-login-language-block',template:function(e){let loginLang=app.config.lang;let result='';$.each(languages,function(index,item){let addclass='';if(item.code==loginLang)
addclass=' selected';else
addclass='';result+='<a class="myls-login-language '+addclass+'" href="javascript:void(0)" onclick="app.translate.changeLocaleForm(\''+item.code+'\')">'+item.code+'</a>';});return result;}}}
getLinkRestore(){return{colSpan:2,dataField:"restore",label:{visible:false},template:function(data){return'<a href="restore" title="'+app.translate.saveString("Восстановить пароль")+'">'+app.translate.saveString("Забыли пароль?")+'</a>';}}}
changeLocaleForm(){let authForm=$("#"+this.formIdn).dxForm('instance');authForm.option('items',this.getFormItems());authForm.repaint();}}
const app=new AppCore();let curUrl=document.location.pathname;let page=curUrl.split('/').pop();const auth=new Auth(page);auth.initForm();;