$(document).ready(function(){
	$('.fd_device').hide();
	
	page_data_load("settings_configuration");
	transHTMLString();
	
	$('#uploadedfile').width($('#fromComp').outerWidth(true));
	//$('#uploadcomputer').width($('#fromComp').outerWidth(true));
	$('#uploadedfile1').width($('#fromComp1').outerWidth(true));
	//$('#uploadcomputer1').width($('#fromComp1').outerWidth(true));
	$('.window_resize').on('window_resize', function(){
		$('#uploadedfile').width($('#fromComp').outerWidth(true));
		$('#uploadedfile1').width($('#fromComp1').outerWidth(true));
	});
});

var flag = 0;

function page_settings_configuration_load(data){
	var html = '';
	var is_computer_load = 0;
	
	$.each(data, function(e_key, e_value){
		$.each(e_value, function(key, val){
			if(key == "is_computer_load"){
				html += '<div id="is_computer_load" value="'+val+'"></div>';
				is_computer_load = val;
			}
			if(key == "created_on") html += '<div id="created_on" value="'+val+'"></div>';
			if(key == "fw_version") html += '<div id="fw_version" value="'+val+'"></div>';
			if(key == "description") html += '<div id="description" value="'+val+'"></div>';
			if(key == "user_created_on") html += '<div id="user_created_on" value="'+val+'"></div>';
			if(key == "user_fw_version") html += '<div id="user_fw_version" value="'+val+'"></div>';
			if(key == "user_description") html += '<div id="user_description" value="'+val+'"></div>';
			
			if(key == "usb_created_on") html += '<div id="usb_created_on" value="'+val+'"></div>';
			if(key == "usb_fw_version") html += '<div id="usb_fw_version" value="'+val+'"></div>';
			if(key == "usb_description") html += '<div id="usb_description" value="'+val+'"></div>';
			if(key == "user_usb_created_on") html += '<div id="user_usb_created_on" value="'+val+'"></div>';
			if(key == "user_usb_fw_version") html += '<div id="user_usb_fw_version" value="'+val+'"></div>';
			if(key == "user_usb_description") html += '<div id="user_usb_description" value="'+val+'"></div>';
		});
	});
	
	$('#data_store').html(html);
	
	if(is_computer_load == '1'){
		//
		var t2 =new Image();
		t2.src = "img/icon-thinking.gif";
		t2.id = "progress-bar-thinking-icon";
		//
		$('.popup.tL').html(page_settings_configuration_load_configuration_from_computer('easybox'));
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#fromComp .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
            //disabled button
            $('#cancelButton').attr('disabled', 'disabled');
            $('#applyButton').attr('disabled', 'disabled');
			//Check Validation
			$('.scm_error_msg').remove();
			$('.popup input').removeClass('input-message-error');
			//Check Validation End
			
			//send data
			var out_pwd = $('.popup input[type="password"]').val();
			var out_str = '[';
			out_str += '{ "is_computer_load" : "1" },';
			$('.popup .row.big input.button').each(function(key, val){
				var id = $(this).attr('id');
				var check = $(this).hasClass('checkbox-checked');
				
				if(check) out_str += '{ "'+id+'" : "1" },';
				else out_str += '{ "'+id+'" : "0" },';
			});
			out_str = out_str.slice(0, -1);
			out_str += ']';
			
			var data_format = [
				{nameObj : settingsConfigurationRestore, value : out_str},
				{nameObj : settingsConfigurationRestorePWD, value : out_pwd},
			];
			dataBatchSend(data_format, setSettingsConfigurationRet, "settings_configuration");
			
			var restore_time = 30; //sec
			var restart_time = 120; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_restore = 0;
			var tmp_restart = 0;
			
			function setSettingsConfigurationRet(data, textStatus, jqXHR){
				if(data == '1'){
					$('.popup.tL').html(page_settings_configuration_progressHtmlStr());
					$('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
					$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
					setTimeout(fromCompRestoreWaiting, 1000);
					
					flag = 0;
				}else if(data == '-1'){
					$('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
					
					//.popup .button-cancel
					$('.popup .button-cancel').on('click', function () {
						if(logMessage && window.console) console.log(".popup .button-cancel click");
						
						$('.popup, .blackBackground').fadeOut();
					});
					
					$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
					$('.popup, .blackBackground').fadeIn();
					
					page_data_load("settings_configuration");
					flag = 1;
				}else if(data == '-2'){
					$('.popup input[type="password"]').addClass('input-message-error');
					
					var html = '<div class="scm_error_msg message message-error">'+getHTMLString(700096)+'</div>';
					$('.popup .clearfix.apply-cancel').before(html);
					
					page_data_load("settings_configuration");
					flag = 1;
				}else{
					$('.popup, .blackBackground').fadeOut();
					
					page_data_load("settings_configuration");
					flag = 1;
				}
                //enabled button
                $('#cancelButton').removeAttr('disabled');
                $('#applyButton').removeAttr('disabled');
			}

			function fromCompRestoreWaiting(){
				tmp_restore++;
				var tmp_width = (full_width / restore_time);
				var now_width = tmp_restore * tmp_width;
				
				$('#progress-bar-image').css('width', now_width +'px');
				
				if(full_width >= now_width){
					if(flag == 0){
						setTimeout(fromCompRestoreWaiting, 1000);
					}else{
						return;
					}
                }else{
					$('.popup.tL').html(page_settings_configuration_successfullyHtmlStr());
					document.getElementById("progress-bar-thinking-box").appendChild(t2);
					
					setTimeout(fromCompRestartWaiting, 1000);
				}
			}
			
			function fromCompRestartWaiting(){
				tmp_restart++;
				if(restart_time >= tmp_restart){
					setTimeout(fromCompRestartWaiting, 1000);
				}else{
					window.parent.location = 'index.htm';
				}
			}
		});
		
		//input#fromComp .scm-cancel
		$('.scm-cancel').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-cancel click");
			
			var out_str = '[{ "is_computer_load" : "-1" }]';
			
			var data_format = [
				{nameObj : settingsConfigurationRestore, value : out_str},
			];
			dataBatchSend(data_format, setSettingsConfigurationCancelRet, "settings_configuration");
			
			function setSettingsConfigurationCancelRet(data, textStatus, jqXHR){
				page_data_load("settings_configuration");
				$('.popup, .blackBackground').fadeOut();
			}
		});
		
	}else if(is_computer_load == '-1'){ //Invalid Config File
		$('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
	}
}

function page_settings_configuration_savingHtmlStr(){
	var html = '';
	html += '<p class="title"><span id="lang507065">'+getHTMLString(507065)+'</span></p>';
	html += '<div class="tC">';
	html += '<img src="img/icon-thinking.gif" alt="Loading...">';
	html += '</div>';
	
	return html;
}

function page_settings_configuration_progressHtmlStr(){
	var html = '';
	html += '<p class="title"><span id="lang507024">'+getHTMLString(507024)+'</span></p>';
	html += '<div class="row big">';
	html += '<div class="left">';
	html += '<span id="lang507025">'+getHTMLString(507025)+'</span></div>';
	html += '</div>';
	html += '<div class="tC">';
	html += '<div id="progress-bar-box" style="margin: 0 auto;">';
	html += '<div id="progress-bar-image"></div>';
	html += '</div>';
	html += '</div>';
	
	return html;
}

function page_settings_configuration_successfullyHtmlStr(){
	var html = '';
	html += '<p class="title"><span id="lang507026">'+getHTMLString(507026)+'</span></p>';
	html += '<div class="row big">';
	html += '<div class="left">';
	html += '<span id="lang507027">'+getHTMLString(507027)+'</span></div>';
	html += '</div>';
	html += '<div class="row big">';
	html += '<div id="progress-bar-thinking-box" class="tC" style="border-top: medium none;">';
	html += '</div>';
	html += '</div>';
	
	return html;
}

function page_settings_configuration_load_configuration_description(data_type){
	var html = '';
	html += '<div class="row">';
	html += '<div class="left">';
	html += '<span id="lang507052">'+getHTMLString(507052)+'</span></div>';
	html += '<div class="right">';
	html += '<div class="left" id="created_on">';
	if(data_type != null){
		if(data_type == 'easybox') html += $('#data_store #created_on').attr('value');
		if(data_type == 'user_easybox') html += $('#data_store #user_created_on').attr('value');
		if(data_type == 'usb') html += $('#data_store #usb_created_on').attr('value');
		if(data_type == 'user_usb') html += $('#data_store #user_usb_created_on').attr('value');
	}
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '<div class="row">';
	html += '<div class="left">';
	html += '<span id="lang507053">'+getHTMLString(507053)+'</span></div>';
	html += '<div class="right">';
	html += '<div class="left" id="fw_version">';
	if(data_type != null){
		if(data_type == 'easybox') html += $('#data_store #fw_version').attr('value');
		if(data_type == 'user_easybox') html += $('#data_store #user_fw_version').attr('value');
		if(data_type == 'usb') html += $('#data_store #usb_fw_version').attr('value');
		if(data_type == 'user_usb') html += $('#data_store #user_usb_fw_version').attr('value');
	}
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '<div class="row">';
	html += '<div class="left">';
	html += '<span id="lang507022">'+getHTMLString(507022)+'</span></div>';
	html += '</div>';
	html += '<div class="row configuration-comment">';
	html += '<div class="left" id="comment">';
	if(data_type != null){
		if(data_type == 'easybox') html += $('#data_store #description').attr('value');
		if(data_type == 'user_easybox') html += $('#data_store #user_description').attr('value');
		if(data_type == 'usb') html += $('#data_store #usb_description').attr('value');
		if(data_type == 'user_usb') html += $('#data_store #user_usb_description').attr('value');
	}
	html += '</div>';
	html += '</div>';
	return html;
}

function page_settings_configuration_load_configuration_checked(data_type){
	var is_computer_load = '0';
	if(data_type != null){
		tmp_val = $('#data_store #is_computer_load').attr('value');
		if(tmp_val != undefined) is_computer_load = tmp_val;
	}
		
	var html = '';
	
	html += '<div class="clearfix apply-cancel">';
	html += '<input id="applyButton" class="button button-apply scm-apply" value="'+getHTMLString(700047)+'" type="button">';
	html += ' ';
	html += '<input id="cancelButton" class="button button-cancel scm-cancel" value="'+getHTMLString(700002)+'" type="button">';
	html += '</div>';
	
	return html;
}

function page_settings_configuration_load_configuration_from_usb(data_type){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<p class="title"><span id="lang1301308">'+getHTMLString(1301308)+'</span></p>';
	html += page_settings_configuration_load_configuration_description(data_type);
	html += page_settings_configuration_load_configuration_checked(data_type);
	
	return html;
}

function page_settings_configuration_load_configuration_from_router(data_type){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<p class="title"><span id="lang507021">'+getHTMLString(507021)+'</span></p>';
	html += page_settings_configuration_load_configuration_description(data_type);
	html += page_settings_configuration_load_configuration_checked(data_type);
	
	return html;
}

function page_settings_configuration_load_configuration_from_computer(data_type){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<p class="title"><span id="lang507028">'+getHTMLString(507028)+'</span></p>';
	
	html += page_settings_configuration_load_configuration_description(data_type);
	
	html += '<div class="row" style="padding-top: 24px;">';
	html += '<div class="left"><span id="lang507029">'+getHTMLString(507029)+'</span></div>';
	html += '</div>';
	html += '<div class="row">';
	html += '<div class="left"><span id="lang507030">'+getHTMLString(507030)+'</span></div>';
	html += '<div class="right"><input type="password"></input></div>';
	html += '</div>';
	
	html += page_settings_configuration_load_configuration_checked(data_type);
	
	return html;
}

function page_settings_configuration_InvalidPasswordHtmlStr(){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<p class="title"><span id="lang507056">'+getHTMLString(507056)+'</span></p>';
	html += '<div class="row big">';
	html += '<div class="left">';
	html += '<span id="lang700138">'+getHTMLString(700138)+'</span></div>';
	html += '</div>';
	
	html += '<div class="clearfix apply-cancel">';
	html += '<input class="button button-cancel scm-cancel" value="'+getHTMLString(700002)+'" type="button">';
	html += '</div>';
	
	return html;
}

function page_settings_configuration_InvalidConfigFileHtmlStr(){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<p class="title"><span id="lang507056">'+getHTMLString(507056)+'</span></p>';
	html += '<div class="row big">';
	html += '<div class="left">';
	html += '<span id="lang507055">'+getHTMLString(507055)+'</span></div>';
	html += '</div>';
	
	html += '<div class="clearfix apply-cancel">';
	html += '<input class="button button-cancel scm-cancel" value="'+getHTMLString(700002)+'" type="button">';
	html += '</div>';
	
	return html;
}

$(function () {
	//Save & Restore Complete Configuration
	//input#saveUSB
	$('input#saveUSB').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveUSB click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang1301307">'+getHTMLString(1301307)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class="">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveUSB .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			var description_str = $('.popup textarea').val();
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "usb"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str}
			];
			dataBatchSend(data_format, settingsConfigurationSaveEasyRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveEasyRet(data, textStatus, jqXHR){
				page_data_load("settings_configuration");
				
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
	});
	
	//input#saveEasy
	$('input#saveEasy').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveEasy click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang507016">'+getHTMLString(507016)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class="">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveEasy .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			var description_str = $('.popup textarea').val();
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "easybox"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str},
			];
			dataBatchSend(data_format, settingsConfigurationSaveEasyRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveEasyRet(data, textStatus, jqXHR){
				page_data_load("settings_configuration");
				
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
	});
	
	//input#saveComp
	$('input#saveComp').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveComp click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang507019">'+getHTMLString(507019)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class=" ">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span>'+getHTMLString('PAGE_CONFIGURATION_SAVING_CONFIGURATION_TO_COMPUTER_POPUP_CREATE_PASSWORD_LABEL')+'</span></div>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700044">'+getHTMLString(700044)+'</span></div>';
		html += '<div class="right">';
		html += '<input id="pwd" class="scm_min_length scm_passwd_valid" scm_min_length="8" type="password">';
		html += '</div>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700045">'+getHTMLString(700045)+'</span></div>';
		html += '<div class="right">';
		html += '<input id="re_pwd" class="scm_min_length scm_passwd_valid" scm_min_length="8" type="password">';
		html += '</div>';
		html += '</div>';
		//
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700237">'+getHTMLString(700237)+'</span>'; //Password Strength
		html += '</div>';
		html += '<div class="right" style="width: 194px;">';
		html += '<div class="passwordStrength"></div>';
		html += '</div>';
		html += '</div>';
		//
		html += '<div class="message message-info">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_MINIMUM_REQUIREMENTS">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_MINIMUM_REQUIREMENTS')+'</span>'; //For your security we suggest you to use lower &amp; uppercase letters, numbers and symbols
		html += '</div>';
		html += '<div style="display: none;" class="message message-error not-similiar">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORDS_DONT_MATCH">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORDS_DONT_MATCH')+'</span>'; //The passwords you entered do not match.
		html += '</div>';
		html += '<div style="display: none;" class="message message-error short-password">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_SHORT">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_SHORT')+'</span>'; //The length of password must be 8 characters.
		html += '</div>';
		//
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save2 scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		var obj = $('.popup.tL').find('.passwordStrength');
		passwordStrength('', obj);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveComp .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//Check Validation
			$('.message-error').hide();
			$('.scm_error_msg').remove();
			$('#pwd, #re_pwd').removeClass('input-message-error');
			
			var description_str = $('.popup  textarea').val();
			var pwd = $('.popup .row #pwd').val();
			var re_pwd = $('.popup .row #re_pwd').val();
			
			if(pwd != re_pwd) {
				$('.popup .row #pwd').addClass('input-message-error');
				$('.popup .row #re_pwd').addClass('input-message-error');
				
				$('.message-error.not-similiar').show();
				return;
			}
			
			if(pwd.length < 8) {
				$('.popup .row #pwd').addClass('input-message-error');
				
				$('.message-error.short-password').show();
				return;
			}
			
			if(!chkInputTextValidation('#pwd, #re_pwd') ){
				//msg
				var element_name = getHTMLString(700044);
				var msg = getHTMLString(700078);
				msg = msg.replace('%s1', element_name);
				msg = msg.replace('% S1', element_name);
				var html = '<div class="scm_error_msg message message-error">'+msg+'</div>';
				$('.popup .clearfix.apply-cancel').before(html);
				//msg end
				
				return;
			}
			//Check Validation End
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "computer"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str},
				{nameObj : settingsConfigurationSavePWD, value : pwd},
			];
			dataBatchSend(data_format, settingsConfigurationSaveCompRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveCompRet(data, textStatus, jqXHR){
				if(data == '1'){
					window.location = '/data/Backup.json?_=' + new Date().getTime() + '&csrf_token=' + csrf_token;
				}
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
		
		$('textarea').on('keyup', function (e) {
			if(logMessage && window.console) console.log('textarea keyup');
			var code = e.keyCode || e.which;
			
			if (code != '9') { //not tab key
				if($(this).val().length >= 31){
					$(this).val($(this).val().slice(0, 31));
					$(this).next().focus().select();
				}
			}
		});
		
		//.popup input[id=pwd][type=password]
		$('.popup input[id=pwd][type=password]').keyup(function(){
			if(logMessage && window.console) console.log(".popup input[id=pwd][type=password] keyup");
			
			var pwd = $(this).val();
			var obj = $(this).closest('.popup').find('.passwordStrength');
			passwordStrength(pwd, obj);
		});
		
		//.popup input[id=pwd][type=password]
		$('.popup input[id=pwd][type=password]').on('paste', function(){
			if(false && window.console) console.log(".popup input[id=pwd][type=password] paste");
			
			setTimeout(function(){
				var pwd = $('.popup input[id=pwd][type=password]').val();
				var obj = $('.popup input[id=pwd][type=password]').closest('.popup').find('.passwordStrength');
				passwordStrength(pwd, obj);
			}, 100);
		});
	});
	
	//input#fromUSB
	$('input#fromUSB').bind("click",function(){
		if(logMessage && window.console) console.log("input#fromUSB click");
		//
		var t2 =new Image();
		t2.src = "img/icon-thinking.gif";
		t2.id = "progress-bar-thinking-icon";
		//
		$('.popup.tL').html(page_settings_configuration_load_configuration_from_usb("usb"));
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#fromUSB .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//send data
			var out_str = '[';
			out_str += '{ "is_computer_load" : "0" },';
			$('.popup .row.big input.button').each(function(key, val){
				var id = $(this).attr('id');
				var check = $(this).hasClass('checkbox-checked');
				
				if(check) out_str += '{ "'+id+'" : "1" },';
				else out_str += '{ "'+id+'" : "0" },';
			});
			out_str = out_str.slice(0, -1);
			out_str += ']';
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "usb"},
				{nameObj : settingsConfigurationRestore, value : out_str},
			];
			dataBatchSend(data_format, setSettingsConfigurationRet, "settings_configuration");
			//
			var restore_time = 30; //sec
			var restart_time = 120; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_restore = 0;
			var tmp_restart = 0;
            $('.popup.tL').html(page_settings_configuration_progressHtmlStr());
            $('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
            $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
            setTimeout(fromEasyRestoreWaiting, 1000);
            function setSettingsConfigurationRet(data, textStatus, jqXHR){
                if(data == '1'){
                    flag = 0;
                }
                else if(data == '-1'){
                    $('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
					
					//.popup .button-cancel
					$('.popup .button-cancel').on('click', function () {
						if(logMessage && window.console) console.log(".popup .button-cancel click");
						
						$('.popup, .blackBackground').fadeOut();
					});
					
                    $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
                    $('.popup, .blackBackground').fadeIn();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
                else{
                    $('.popup, .blackBackground').fadeOut();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
            }


            function fromEasyRestoreWaiting(){
                tmp_restore++;
                var tmp_width = (full_width / restore_time);
                var now_width = tmp_restore * tmp_width;

                $('#progress-bar-image').css('width', now_width +'px');

                if(full_width >= now_width){
                    if(flag == 0)
                        setTimeout(fromEasyRestoreWaiting, 1000);
                    else
                        return;
                }else{
					$('.popup.tL').html(page_settings_configuration_successfullyHtmlStr());
					document.getElementById("progress-bar-thinking-box").appendChild(t2);
					
					setTimeout(fromEasyRestartWaiting, 1000);
				}
			}
			
			function fromEasyRestartWaiting(){
				tmp_restart++;
				if(restart_time >= tmp_restart){
					setTimeout(fromEasyRestartWaiting, 1000);
				}else{
					window.parent.location = 'index.htm';
				}
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
	});
	
	//input#fromEasy
	$('input#fromEasy').bind("click",function(){
		if(logMessage && window.console) console.log("input#fromEasy click");
		//
		var t2 =new Image();
		t2.src = "img/icon-thinking.gif";
		t2.id = "progress-bar-thinking-icon";
		//
		$('.popup.tL').html(page_settings_configuration_load_configuration_from_router("easybox"));
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#fromEasy .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//send data
			var out_str = '[';
			out_str += '{ "is_computer_load" : "0" },';
			$('.popup .row.big input.button').each(function(key, val){
				var id = $(this).attr('id');
				var check = $(this).hasClass('checkbox-checked');
				
				if(check) out_str += '{ "'+id+'" : "1" },';
				else out_str += '{ "'+id+'" : "0" },';
			});
			out_str = out_str.slice(0, -1);
			out_str += ']';
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "easybox"},
				{nameObj : settingsConfigurationRestore, value : out_str},
			];
			dataBatchSend(data_format, setSettingsConfigurationRet, "settings_configuration");
			//
			var restore_time = 30; //sec
			var restart_time = 120; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_restore = 0;
			var tmp_restart = 0;
            $('.popup.tL').html(page_settings_configuration_progressHtmlStr());
            $('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
            $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
            setTimeout(fromEasyRestoreWaiting, 1000);
            function setSettingsConfigurationRet(data, textStatus, jqXHR){
                if(data == '1'){
                    flag = 0;
                }
                else if(data == '-1'){
                    $('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
					
					//.popup .button-cancel
					$('.popup .button-cancel').on('click', function () {
						if(logMessage && window.console) console.log(".popup .button-cancel click");
						
						$('.popup, .blackBackground').fadeOut();
					});
					
                    $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
                    $('.popup, .blackBackground').fadeIn();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
                else{
                    $('.popup, .blackBackground').fadeOut();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
            }


            function fromEasyRestoreWaiting(){
                tmp_restore++;
                var tmp_width = (full_width / restore_time);
                var now_width = tmp_restore * tmp_width;

                $('#progress-bar-image').css('width', now_width +'px');

                if(full_width >= now_width){
                    if(flag == 0)
                        setTimeout(fromEasyRestoreWaiting, 1000);
                    else
                        return;
                }else{
					$('.popup.tL').html(page_settings_configuration_successfullyHtmlStr());
					document.getElementById("progress-bar-thinking-box").appendChild(t2);
					
					setTimeout(fromEasyRestartWaiting, 1000);
				}
			}
			
			function fromEasyRestartWaiting(){
				tmp_restart++;
				if(restart_time >= tmp_restart){
					setTimeout(fromEasyRestartWaiting, 1000);
				}else{
					window.parent.location = 'index.htm';
				}
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
	});
	
	$('#uploadedfile').fileupload({
		dataType: 'json',
		add: function (e, data) {
			if(false && window.console) console.log("#uploadedfile add");
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "admin"}
			];
			dataBatchSend(data_format, uploadedfileRet, "settings_configuration");
			
			function uploadedfileRet(rdata, textStatus, jqXHR){
				
				var tmpAction = $('#settingsRestore').closest('form').attr('action').split('?')[0];
				$('#settingsRestore').closest('form').attr('action', tmpAction + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token);
				
				data.submit();
			}
		},
		done: function (e, data) {
			if(false && window.console) console.log("#uploadedfile done");
			
			$('.message-arrowbox').hide();
			page_data_load("settings_configuration");
		},
		fail: function (e, data) {
			if(false && window.console) console.log("#uploadedfile fail");
			
			$('.message-arrowbox').hide();
			page_data_load("settings_configuration");
		}
	});
	/*
	//input#uploadedfile
	$('input#uploadedfile').bind("change",function(){
		if(logMessage && window.console) console.log("input#uploadedfile change");
		
		var data_format = [
			{nameObj : settingsConfigurationRestoreType, value : "admin"},
		];
		dataBatchSend(data_format, uploadedfileRet, "settings_configuration");
		
		function uploadedfileRet(data, textStatus, jqXHR){
			
			var tmpAction = $('#settingsRestore').closest('form').attr('action');
			$('#settingsRestore').closest('form').attr('action', tmpAction + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token);
			
			$('#settingsRestore').trigger('click');
		}
	});
	/*
	//input#uploadedfile
	$('#uploadedfile').bind('mousedown', function(){
		if(logMessage && window.console) console.log("#uploadedfile mousedown");
		
		//$('#fromComp').css('background-image', 'url(../img/button-grey-wide-pressed.png)');
	});
	
	//input#uploadedfile
	$('#uploadedfile').bind('mouseup', function(){
		if(logMessage && window.console) console.log("#uploadedfile mouseup");
		
		//$('#fromComp').css('background-image', 'url(../img/button-grey-wide-shadow.png)');
	});
	*/
	//Save & Restore User Configuration
	//input#saveUSB1
	$('input#saveUSB1').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveUSB1 click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang1301307">'+getHTMLString(1301307)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class=" ">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveUSB1 .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			var description_str = $('.popup textarea').val();
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "user_usb"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str}
			];
			dataBatchSend(data_format, settingsConfigurationSaveEasyRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveEasyRet(data, textStatus, jqXHR){
				page_data_load("settings_configuration");
				
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
	});
	
	//input#saveEasy1
	$('input#saveEasy1').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveEasy1 click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang507016">'+getHTMLString(507016)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class=" ">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveEasy1 .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			var description_str = $('.popup textarea').val();
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "user_easybox"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str},
			];
			dataBatchSend(data_format, settingsConfigurationSaveEasyRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveEasyRet(data, textStatus, jqXHR){
				page_data_load("settings_configuration");
				
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
	});
	
	//input#saveComp1
	$('input#saveComp1').bind("click",function(){
		if(logMessage && window.console) console.log("input#saveComp1 click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang507019">'+getHTMLString(507019)+'</span></p>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang507017">'+getHTMLString(507017)+'</span></div>';
		html += '</div>';
		html += '<div class=" ">';
		html += '<textarea style="width: 100%;">'+getHTMLString(507018)+'</textarea>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span>'+getHTMLString('PAGE_CONFIGURATION_SAVING_CONFIGURATION_TO_COMPUTER_POPUP_CREATE_PASSWORD_LABEL')+'</span></div>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700044">'+getHTMLString(700044)+'</span></div>';
		html += '<div class="right">';
		html += '<input id="pwd" class="scm_min_length scm_passwd_valid" scm_min_length="8" type="password">';
		html += '</div>';
		html += '</div>';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700045">'+getHTMLString(700045)+'</span></div>';
		html += '<div class="right">';
		html += '<input id="re_pwd" class="scm_min_length scm_passwd_valid" scm_min_length="8" type="password">';
		html += '</div>';
		html += '</div>';
		//
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span id="lang700237">'+getHTMLString(700237)+'</span>'; //Password Strength
		html += '</div>';
		html += '<div class="right" style="width: 194px;">';
		html += '<div class="passwordStrength"></div>';
		html += '</div>';
		html += '</div>';
		//
		html += '<div class="message message-info">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_MINIMUM_REQUIREMENTS">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_MINIMUM_REQUIREMENTS')+'</span>'; //For your security we suggest you to use lower &amp; uppercase letters, numbers and symbols
		html += '</div>';
		html += '<div style="display: none;" class="message message-error not-similiar">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORDS_DONT_MATCH">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORDS_DONT_MATCH')+'</span>'; //The passwords you entered do not match.
		html += '</div>';
		html += '<div style="display: none;" class="message message-error short-password">';
		html += '<span class="language-string" name="PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_SHORT">'+getHTMLString('PAGE_GENERAL_PASSWORD_POPUP_PASSWORD_SHORT')+'</span>'; //The length of password must be 8 characters.
		html += '</div>';
		//
		html += '<div class="clearfix apply-cancel">';
		html += '<input class="button button-apply save2 scm-apply" value="'+getHTMLString(700029)+'" type="button">';
		html += ' ';
		html += '<input class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		var obj = $('.popup.tL').find('.passwordStrength');
		passwordStrength('', obj);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#saveComp1 .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//Check Validation
			$('.message-error').hide();
			$('.scm_error_msg').remove();
			$('#pwd, #re_pwd').removeClass('input-message-error');
			
			var description_str = $('.popup  textarea').val();
			var pwd = $('.popup .row #pwd').val();
			var re_pwd = $('.popup .row #re_pwd').val();
			
			if(pwd != re_pwd) {
				$('.popup .row #pwd').addClass('input-message-error');
				$('.popup .row #re_pwd').addClass('input-message-error');
				
				$('.message-error.not-similiar').show();
				return;
			}
			
			if(pwd.length < 8) {
				$('.popup .row #pwd').addClass('input-message-error');
				
				$('.message-error.short-password').show();
				return;
			}
			
			if(!chkInputTextValidation('#pwd, #re_pwd') ){
				
				//msg
				var element_name = getHTMLString(700044);
				var msg = getHTMLString(700078);
				msg = msg.replace('%s1', element_name);
				msg = msg.replace('% S1', element_name);
				var html = '<div class="scm_error_msg message message-error">'+msg+'</div>';
				$('.popup .clearfix.apply-cancel').before(html);
				//msg end
				
				return;
			}
			//Check Validation End
			
			var data_format = [
				{nameObj : settingsConfigurationSaveType, value : "user_computer"},
				{nameObj : settingsConfigurationSaveDescription, value : description_str},
				{nameObj : settingsConfigurationSavePWD, value : pwd},
			];
			dataBatchSend(data_format, settingsConfigurationSaveCompRet, "settings_configuration");
			
			$('.popup.tL').html(page_settings_configuration_savingHtmlStr());
			
			function settingsConfigurationSaveCompRet(data, textStatus, jqXHR){
				if(data == '1'){
					window.location = '/data/Backup.json?_=' + new Date().getTime() + '&csrf_token=' + csrf_token;
				}
				
				$('.popup, .blackBackground').fadeOut();
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//textarea
		$('textarea').bind("click",function(){
			if(logMessage && window.console) console.log("textarea click");
			
			if($(this).text() == getHTMLString(507018)) $(this).text('');
		});
		
		//.popup input[id=pwd][type=password]
		$('.popup input[id=pwd][type=password]').keyup(function(){
			if(logMessage && window.console) console.log(".popup input[id=pwd][type=password] keyup");
			
			var pwd = $(this).val();
			var obj = $(this).closest('.popup').find('.passwordStrength');
			passwordStrength(pwd, obj);
		});
		
		//.popup input[id=pwd][type=password]
		$('.popup input[id=pwd][type=password]').on('paste', function(){
			if(false && window.console) console.log(".popup input[id=pwd][type=password] paste");
			
			setTimeout(function(){
				var pwd = $('.popup input[id=pwd][type=password]').val();
				var obj = $('.popup input[id=pwd][type=password]').closest('.popup').find('.passwordStrength');
				passwordStrength(pwd, obj);
			}, 100);
		});
	});
	
	//input#fromUSB1
	$('input#fromUSB1').bind("click",function(){
		if(logMessage && window.console) console.log("input#fromUSB1 click");
		//
		var t2 =new Image();
		t2.src = "img/icon-thinking.gif";
		t2.id = "progress-bar-thinking-icon";
		//
		$('.popup.tL').html(page_settings_configuration_load_configuration_from_usb("user_usb"));
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#fromUSB1 .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//send data
			var out_str = '[';
			out_str += '{ "is_computer_load" : "0" },';
			$('.popup .row.big input.button').each(function(key, val){
				var id = $(this).attr('id');
				var check = $(this).hasClass('checkbox-checked');
				
				if(check) out_str += '{ "'+id+'" : "1" },';
				else out_str += '{ "'+id+'" : "0" },';
			});
			out_str = out_str.slice(0, -1);
			out_str += ']';
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "user_usb"},
				{nameObj : settingsConfigurationRestore, value : out_str},
			];
			dataBatchSend(data_format, setSettingsConfigurationRet, "settings_configuration");
			//
			var restore_time = 30; //sec
			var restart_time = 120; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_restore = 0;
			var tmp_restart = 0;
            $('.popup.tL').html(page_settings_configuration_progressHtmlStr());
            $('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
            $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
            setTimeout(fromEasyRestoreWaiting, 1000);
            function setSettingsConfigurationRet(data, textStatus, jqXHR){
                if(data == '1'){
                    flag = 0;
                }
                else if(data == '-1'){
                    $('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
					
					//.popup .button-cancel
					$('.popup .button-cancel').on('click', function () {
						if(logMessage && window.console) console.log(".popup .button-cancel click");
						
						$('.popup, .blackBackground').fadeOut();
					});
					
                    $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
                    $('.popup, .blackBackground').fadeIn();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
                else{
                    $('.popup, .blackBackground').fadeOut();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
            }


            function fromEasyRestoreWaiting(){
                tmp_restore++;
                var tmp_width = (full_width / restore_time);
                var now_width = tmp_restore * tmp_width;

                $('#progress-bar-image').css('width', now_width +'px');

                if(full_width >= now_width){
                    if(flag == 0)
                        setTimeout(fromEasyRestoreWaiting, 1000);
                    else
                        return;
                }else{
					$('.popup.tL').html(page_settings_configuration_successfullyHtmlStr());
					document.getElementById("progress-bar-thinking-box").appendChild(t2);
					
					setTimeout(fromEasyRestartWaiting, 1000);
				}
			}
			
			function fromEasyRestartWaiting(){
				tmp_restart++;
				if(restart_time >= tmp_restart){
					setTimeout(fromEasyRestartWaiting, 1000);
				}else{
					window.parent.location = 'index.htm';
				}
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
	});
	
	//input#fromEasy1
	$('input#fromEasy1').bind("click",function(){
		if(logMessage && window.console) console.log("input#fromEasy1 click");
		//
		var t2 =new Image();
		t2.src = "img/icon-thinking.gif";
		t2.id = "progress-bar-thinking-icon";
		//
		$('.popup.tL').html(page_settings_configuration_load_configuration_from_router("user_easybox"));
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		//input#fromEasy1 .scm-apply
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			//send data
			var out_str = '[';
			out_str += '{ "is_computer_load" : "0" },';
			$('.popup .row.big input.button').each(function(key, val){
				var id = $(this).attr('id');
				var check = $(this).hasClass('checkbox-checked');
				
				if(check) out_str += '{ "'+id+'" : "1" },';
				else out_str += '{ "'+id+'" : "0" },';
			});
			out_str = out_str.slice(0, -1);
			out_str += ']';
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "user_easybox"},
				{nameObj : settingsConfigurationRestore, value : out_str},
			];
			dataBatchSend(data_format, setSettingsConfigurationRet, "settings_configuration");
			//
			var restore_time = 30; //sec
			var restart_time = 120; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_restore = 0;
			var tmp_restart = 0;
            $('.popup.tL').html(page_settings_configuration_progressHtmlStr());
            $('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
            $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
            setTimeout(fromEasyRestoreWaiting, 1000);
            function setSettingsConfigurationRet(data, textStatus, jqXHR){
                if(data == '1'){
                    flag = 0;
                }
                else if(data == '-1'){
                    $('.popup.tL').html(page_settings_configuration_InvalidConfigFileHtmlStr());
					
					//.popup .button-cancel
					$('.popup .button-cancel').on('click', function () {
						if(logMessage && window.console) console.log(".popup .button-cancel click");
						
						$('.popup, .blackBackground').fadeOut();
					});
					
                    $('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
                    $('.popup, .blackBackground').fadeIn();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
                else{
                    $('.popup, .blackBackground').fadeOut();
                    page_data_load("settings_configuration");
                    flag = 1;
                }
            }


            function fromEasyRestoreWaiting(){
                tmp_restore++;
                var tmp_width = (full_width / restore_time);
                var now_width = tmp_restore * tmp_width;

                $('#progress-bar-image').css('width', now_width +'px');

                if(full_width >= now_width){
                    if(flag == 0)
                        setTimeout(fromEasyRestoreWaiting, 1000);
                    else
                        return;
                }else{
					$('.popup.tL').html(page_settings_configuration_successfullyHtmlStr());
					document.getElementById("progress-bar-thinking-box").appendChild(t2);
					
					setTimeout(fromEasyRestartWaiting, 1000);
				}
			}
			
			function fromEasyRestartWaiting(){
				tmp_restart++;
				if(restart_time >= tmp_restart){
					setTimeout(fromEasyRestartWaiting, 1000);
				}else{
					window.parent.location = 'index.htm';
				}
			}
			
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(logMessage && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
	});
	
	$('#uploadedfile1').fileupload({
		dataType: 'json',
		add: function (e, data) {
			if(false && window.console) console.log("#uploadedfile1 add");
			
			var data_format = [
				{nameObj : settingsConfigurationRestoreType, value : "user"}
			];
			dataBatchSend(data_format, uploadedfile1Ret, "settings_configuration");
			
			function uploadedfile1Ret(rdata, textStatus, jqXHR){
				
				var tmpAction = $('#settingsRestore1').closest('form').attr('action').split('?')[0];
				$('#settingsRestore1').closest('form').attr('action', tmpAction + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token);
				
				data.submit();
			}
		},
		done: function (e, data) {
			if(false && window.console) console.log("#uploadedfile1 done");
			
			$('.message-arrowbox').hide();
			page_data_load("settings_configuration");
		},
		fail: function (e, data) {
			if(false && window.console) console.log("#uploadedfile1 fail");
			
			$('.message-arrowbox').hide();
			page_data_load("settings_configuration");
		}
	});
	
	$('#fromComp1').on('click', function(){
		if(false && window.console) console.log("#fromComp1 click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<h2>';
		html += '<span>'+getHTMLString("PAGE_CONFIGURATION_LOAD_OLD_CONFIGURATION_START_POPUP_DESCRIPTION")+'</span>'; //Before you restore an old configuration make sure you saved the current settings.
		html += '</h2>';
		html += '<div class="apply-cancel">';
		html += '<input type="button" value="'+getHTMLString("PAGE_CONFIGURATION_LOAD_OLD_CONFIGURATION_START_POPUP_OK_BUTTON")+'" class="button button-apply"> '; //OK
		html += '<input type="button" value="'+getHTMLString("PAGE_CONFIGURATION_LOAD_OLD_CONFIGURATION_START_POPUP_CANCEL_BUTTON")+'" class="button button-cancel">'; //Cancel
		html += '</div>';
		
		$('.popup.tL').html(html);
		
		//.popup .button-apply
		$('.popup .button-apply').on('click', function () {
			if(false && window.console) console.log(".popup .button-apply click");
			
			$('#uploadedfile1').trigger('click');
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//.popup .button-cancel
		$('.popup .button-cancel').on('click', function () {
			if(false && window.console) console.log(".popup .button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
	});
	/*
	//input#uploadedfile1
	$('input#uploadedfile1').bind("change",function(){
		if(logMessage && window.console) console.log("input#uploadedfile1 change");
		
		var data_format = [
			{nameObj : settingsConfigurationRestoreType, value : "user"},
		];
		dataBatchSend(data_format, uploadedfile1Ret, "settings_configuration");
		
		function uploadedfile1Ret(data, textStatus, jqXHR){
			
			var tmpAction = $('#settingsRestore1').closest('form').attr('action');
			$('#settingsRestore1').closest('form').attr('action', tmpAction + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token);
			
			$('#settingsRestore1').trigger('click');
		}
	});
	/*
	//input#uploadedfile1
	$('#uploadedfile1').bind('mousedown', function(){
		if(logMessage && window.console) console.log("#uploadedfile mousedown");
		
		//$('#fromComp1').css('background-image', 'url(../img/button-grey-wide-pressed.png)');
	});
	
	//input#uploadedfile1
	$('#uploadedfile1').bind('mouseup', function(){
		if(logMessage && window.console) console.log("#uploadedfile mouseup");
		
		//$('#fromComp1').css('background-image', 'url(../img/button-grey-wide-shadow.png)');
	});
	*/
});
