var sys_trying_times = 0;
var salt = "";
var page_blocked = false;
var without_password = false;
var credential_detail = false;
var challenge = "";

//init page
function page_init(){
	$('div#wrap').focus();
	
	load_multi_lang_data();
	
	var html = '';
	html += '<div id="activation-content-left">';
	html += '<img src="img/vox3.0.png" alt="Router">';
	html += '</div>';
	$('div#activation-content-right').before(html);
	
	$('div#activation-content-right').attr("style", "");
	//
	if(without_password){ //Login without password
		$('div#activation-content-right').html(page_activation_content_right_without_password_htmlstr());
		page_activation_content_right_without_password_func_load();
	}else{
		$('div#activation-content-right').html(page_activation_content_right_htmlstr());
		page_activation_content_right_func_load();
	}
	
	html = '';
	if(sys_country == 'TR'){
	html += '<li class="language-switcher"><a href="javascript:not_login_lang_change(\'en_eles\');">English</a></li>';
	html += '<li class="language-switcher"><a href="javascript:not_login_lang_change(\'tu_eles\');">Turkish</a></li>';
	} else if(sys_country == 'GR'){
	html += '<li class="language-switcher"><a href="javascript:not_login_lang_change(\'en_eles\');">English</a></li>';
	html += '<li class="language-switcher"><a href="javascript:not_login_lang_change(\'gr_eles\');">Greek</a></li>';
	}
	$('#language-switcher-list').html(html);
	
	//fw version & ip4/ip6 addr
	var html_out = "";
	html_out += '<span class="language-string">'+getHTMLString(1310025).replace('%s', sys_info.fw_version)+'</span><br>'; //Firmware version: %s
	html_out += '<span class="language-string">'+getHTMLString(1310026).replace('%s', sys_info.wan_ip4_addr)+'</span><br>'; //WAN IPv4 Address: %s
	if(sys_ipv6_status && sys_ipv6_configuration){
		html_out += '<span class="language-string">'+getHTMLString(1310027).replace('%s', sys_info.wan_ip6_addr)+'</span>'; //WAN IPv6 Address: %s
	}
	$('#info').html(html_out);
	
	//browser support
	if(!isBrowserDetectSupport()){
		window.parent.location = 'nbrow.html';
	}
	
	var laenge = $('h1:not(.not) span').text().length;
	if (laenge >= 27) {
	$('h1').addClass('twoLines');
	};
	
	$(document).keydown(function(event){   
		if(event.keyCode==13){
			processEnterFunc($('.button-apply'));
		}
		if(event.keyCode==9){ //tab key

		}
	});
	
	transHTMLString();
	
	setTimeout(function(){window.document.body.focus();}, 200);
	processDelayTime();
}

function page_activation_content_right_htmlstr(){
	var html = '';
	html += '<div class="description">';
	html += '<div class="left">';
	html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_48_SUBTITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_48_SUBTITLE")+'</span>'; //Enter your Vodafone Router Avanzado password.
	html += '</div>';
	html += '</div>';
	html += '<div class="row description">';
	html += '<div class="left">';
	html += '<input type="text" value="" placeholder="'+getHTMLString('ACTIVATION_PAGE_STEP_48_PLACEHOLDER_USERNAME')+'" tabindex="1">'; //Username
	html += '</div>';
	//html += '<div class="right no-mobile">';
	//html += '<input class="button button-apply-wide button-apply" value="'+getHTMLString("ACTIVATION_PAGE_STEP_48_LOG_IN")+'" type="button">'; //Log In
	//html += '</div>';
	html += '</div>';
	html += '<div class="row">';
	html += '<div class="left">';
	html += '<input type="password" value="" placeholder="'+getHTMLString('ACTIVATION_PAGE_STEP_48_PLACEHOLDER_PASSWORD')+'" tabindex="2">';
	html += '</div>';
	html += '<div class="right">';
	html += '<input class="button button-apply-wide button-apply" value="'+getHTMLString("ACTIVATION_PAGE_STEP_48_LOG_IN")+'" type="button">'; //Log In
	html += '</div>';
	html += '</div>';
	//if(credential_detail){
	//	html += '<div class="description" style="clear: both;">';
	//	html += '<div class="left credential-detail">'+getHTMLString('ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_TITLE')+'</div>'; //Where can I find the access credentials?
	//	html += '</div>';
	//}else{
	//	html += '<div class="row description">';
	//	html += '<div class="right">';
	//	html += '<input class="button button-cancel button-wide forgotten-password" id="start" value="'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_BUTTON")+'" type="button">'; //Forgotten Password
	//	html += '</div>';
	//}
	html += '</div>';
	
	return html;
}

function page_activation_content_right_func_load(){
	$('.button-apply').click(function(){
		processEnterFunc($('.button-apply'));
	});
	
	$('.forgotten-password').on('click', function(){
		if(false && window.console) console.log(".forgotten-password click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		
		html += '<div class="task1ForStep5">';
		html += '<h1><span class="language-string" name="ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_TITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_TITLE")+'</span></h1>'; //Password Reset
		html += '<div class="description">';
		html += '<div class="left">';
		html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_SUBTITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_SUBTITLE")+'</span>'; //Click the Reset button and follow the instructions that you will receive by mail.
		html += '</div>';
		html += '</div>';
		html += '</div>';
		
		html += '<div class="task2ForStep5" style="display:none">';
		html += '<h3><span class="language-string" name="ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_TITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_TITLE")+'</span></h3>'; //Password Reset
		html += '<div class="description">';
		html += '<div class="left">';
		html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_STEP_2_SUBTITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_STEP_2_SUBTITLE")+'</span>'; //The email with the instructions for resetting the password was sent.
		html += '</div>';
		html += '</div>';
		html += '<div class="row description noLeftPadding">';
		html += '<div class="right">';
		html += '<input class="button button-cancel" value="Ok" type="button">'; //Ok
		html += '</div>';
		html += '</div>';
		html += '</div>';
		
		html += '<div class="task1ForStep5">';
		html += '<div class="row description noLeftPadding">';
		html += '<div class="right">';
		html += '<input class="button button-apply resetButton" value="'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_RESET_BUTTON")+'" type="button"> '; //Reset
		html += '<input class="button button-cancel task1ForStep5" value="'+getHTMLString("ACTIVATION_PAGE_STEP_48_FORGOTTEN_PASSWORD_POPUP_CANCEL_BUTTON")+'" type="button">'; //Cancel
		html += '</div>';
		html += '</div>';
		html += '</div>';
		
		$('.popup').html(html);
		
		$('body, html').animate({ scrollTop: '0px' });
		$('.popup, .blackBackground').fadeIn();
		
		$('.popup .button-apply').on('click', function(){
			if(false && window.console) console.log(".button-apply click");
			
			var data_format = [
				{nameObj : loginResetPassword, value : '1'}
			];
			
			dataBatchSend(data_format, loginResetPasswordRet, "resetpwd");
		});
		
		$('.popup .button-cancel').on('click', function(){
			if(false && window.console) console.log(".button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
	});
	
	
	$('.credential-detail').on('click', function(){
		if(false && window.console) console.log(".credential-detail click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<div class="task1ForStep5">';
		html += '<h1><span class="language-string" name="ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_POPUP_TITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_POPUP_TITLE")+'</span></h1>'; //Where can I find the access credentials?
		html += '<div id="popup-image">';
		html += '<img src="/img/look_4/activation/access_credentials.png" alt="Router">';
		html += '</div>';
		html += '<div class="description">';
		html += '<div class="left popup-discription"><span class="language-string" name="ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_POPUP_SUBTITLE">'+getHTMLString("ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_POPUP_SUBTITLE")+'</span></div>'; //Utilize your access credentials (Utente and Router Password) written on the label at bottom side of your Vodafone Router Avanzado.
		html += '</div>';
		html += '</div>';
		html += '<div class="row description noLeftPadding">';
		html += '<div class="right">';
		html += '<input type="button" class="button button-cancel" value="'+getHTMLString("ACTIVATION_PAGE_STEP_50_ACCESS_CREDENTIAL_POPUP_OK_BUTTON")+'">';
		html += '</div>';
		html += '</div>';
		
		$('.popup').html(html);
		
		$('body, html').animate({ scrollTop: '0px' });
		$('.popup, .blackBackground').fadeIn();
		
		$('.popup .button-cancel').on('click', function(){
			if(false && window.console) console.log(".button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
	});
}

function page_activation_content_right_without_password_htmlstr(){
	var html = '';
	html += '<div class="description">';
	html += '<div class="left">';
	html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_136_SUBTITLE_">'+getHTMLString("ACTIVATION_PAGE_STEP_136_SUBTITLE_")+'</span>'; //For improve your security we suggest you to create a password to login to your Vodafone Router Avanzado.
	html += '</div>';
	html += '</div>';
	
	html += '<div class="description row noLeftPadding">';
	html += '<div class="left">';
	html += '<input class="button button-wide button-cancel ignore" value="'+getHTMLString("ACTIVATION_PAGE_STEP_136_LOGIN_BUTTON")+'" type="button">'; //Ignore
	html += '</div>';
	html += '<div class="right">';
	html += '<input class="button button-wide button-cancel set_password" value="'+getHTMLString("ACTIVATION_PAGE_STEP_136_ADD_PASSWORD_BUTTON")+'" type="button">'; //Set Password
	html += '</div>';
	html += '</div>';
	
	html += '<div class="row no-border-top description noLeftPadding noTopPadding">';
	html += '<div class="left">';
	html += '<div class="clearfix dont-show"><input id="not-show" class="checkbox checkbox-unchecked" type="checkbox">';
	html += '<label for="not-show"></label>';
	html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_136_INFO_MESSAGE_HIDE_MESSAGE_">'+getHTMLString("ACTIVATION_PAGE_STEP_136_INFO_MESSAGE_HIDE_MESSAGE_")+'</span></div>'; //Remember my choice
	html += '</div>';
	html += '</div>';
	
	html += '<div class="row description">';
	html += '<div class="right">';
	html += '</div>';
	html += '</div>';

	return html;
}

function page_activation_content_right_without_password_func_load(){
	//input[type="checkbox"]
	$('input[type="checkbox"]').on('click',function(){
		if(false && window.console) console.log('input[type="checkbox"] click');
		
		$(this).toggleClass('checkbox-checked checkbox-unchecked');
	});
	
	//.ignore
	$('.ignore').on('click', function(){
		if(false && window.console) console.log(".ignore click");
		
		var passwordSalt = sjcl.codec.hex.toBits(salt);
		var derivedKey = sjcl.misc.pbkdf2("", passwordSalt, 1000, 128);
		var dk_hex = sjcl.codec.hex.fromBits(derivedKey);
		
		setCookie("login_uid", Math.random(), 1);
		setWebStorage("dk", dk_hex);
		
		var without_password = 'ignore';
		var remember_choice = $('#not-show').hasClass('checkbox-checked')?'1':'0';
		
		var data_format = [
			{nameObj : loginWithoutPasswordSet, value : without_password},
			{nameObj : loginRememberChoice, value : remember_choice}
		];
		
		dataBatchSend(data_format, loginWithoutPassworIgnore, "login");
	});
	
	//.set_password
	$('.set_password').on('click', function(){
		if(false && window.console) console.log(".set_password click");
		
		var passwordSalt = sjcl.codec.hex.toBits(salt);
		var derivedKey = sjcl.misc.pbkdf2("", passwordSalt, 1000, 128);
		var dk_hex = sjcl.codec.hex.fromBits(derivedKey);
		
		setCookie("login_uid", Math.random(), 1);
		setWebStorage("dk", dk_hex);
		
		var without_password = 'set_password';
		var remember_choice = $('#not-show').hasClass('checkbox-checked')?'1':'0';
		
		var data_format = [
			{nameObj : loginWithoutPasswordSet, value : without_password},
			{nameObj : loginRememberChoice, value : remember_choice}
		];
		
		dataBatchSend(data_format, loginWithoutPassworSetPassword, "login");
	});
}

function loginWithoutPassworIgnore(data, textStatus, jqXHR){
	window.location.href = "overview.html";
}

function loginWithoutPassworSetPassword(data, textStatus, jqXHR){
	window.location.href = "settings.html#sub=60";
}

function loginResetPasswordRet(data, textStatus, jqXHR){
	if(data == '1'){
		$('.popup .task1ForStep5').hide();
		$('.popup .task2ForStep5').show();
	}
}

function processEnterFunc(obj){
	$('input[type=text], input[type=password]').removeClass('input-error');
	
	var tmp_disabled = obj.attr('disabled');
	if(tmp_disabled != true){
		var user_name = encodeURIComponent($('input[type="text"]').val());
		var passwordSalt = sjcl.codec.hex.toBits(salt);
		var derivedKey = sjcl.misc.pbkdf2($('input[type="password"]').val(), passwordSalt, 1000, 128);
		var dk_hex = sjcl.codec.hex.fromBits(derivedKey);
		var hash1_pass = hex_hmac_sha256('$1$SERCOMM$', unescape(encodeURIComponent($('input[type="password"]').val())));
		var user_password = $('input[type="password"]').val() ;
        var hash_pwd = user_password+challenge; 
        var user_password = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(hash_pwd));

		var data_format = [
			{nameObj : LoginName, value : user_name},
			{nameObj : LoginPWD, value : user_password},
            {nameObj : LoginChallenge, value : challenge}
		];
		setCookie("login_uid", Math.random(), 1);
		setWebStorage("dk", dk_hex);
		dataBatchSend(data_format, loginUserLoginRet, "login");
	}
	
	function loginUserLoginRet(data, textStatus, jqXHR){
		$('div#message').remove();
		var status = data.slice(0,3);
		if(status == '"1"' || status == '[ ]' || status == '1'){
			//setCookie("username",user_name,1);
			window.location.href = "overview.html";
		}else if(status == '2'){
			var html = '';
			html += '<div id="message" class="row description">';
			html += '<div class="message info message-info left"><span id="lang809017">'+getHTMLString(809017)+'</span></div>'; //A user is logged into the device.
			html += '</div>';
			
			var row_length = $('div#activation-content-right .row').length;
			$('div#activation-content-right .row').each(function(key, val){
				if(key == (row_length-1)) $(this).after(html);
			});
		}else if(status == '3'){
			var html = '';
			html += '<div id="message" class="row description">';
			html += '<div class="message message-error">';
			html += '<h2><span>'+getHTMLString(1310000)+'</span></h2>'; //Wrong Password
			html += '<p></p>';
			html += '<div class="message-error-text">';
			html += '<span>'+getHTMLString(1310001)+'</span>'; //The password you entered was incorrect.
			html += '</div>';
			html += '</div>';
			html += '</div>';
			
			var row_length = $('div#activation-content-right .row').length;
			$('div#activation-content-right .row').each(function(key, val){
				if(key == (row_length-1)) $(this).after(html);
			});
	        $.ajax({  
                type : 'get',
                dataType: "json",
                url : './data/login.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
                async : false,
                success : function(data){
                    challenge = getUserData('challenge',data);
                    sys_delay_time = getUserData('delay_time', data);
                    processDelayTime();
                }
            });
	

			$('input[type=password]').addClass('input-error');
		}else if(status == '4'){
			var html = '';
			html += '<div id="message" class="row description">';
			html += '<div class="message message-error">';
			html += '<h2><span>'+getHTMLString(1310000)+'</span></h2>'; //Wrong Password
			html += '<p></p>';
			html += '<div class="message-error-text">';
			html += '<span>'+getHTMLString(1310001)+'</span>'; //The password you entered was incorrect.
			html += '</div>';
			html += '</div>';
			html += '</div>';
			
			var row_length = $('div#activation-content-right .row').length;
			$('div#activation-content-right .row').each(function(key, val){
				if(key == (row_length-1)) $(this).after(html);
			});
			
			$('input[type=text], input[type=password]').addClass('input-error');

            $.ajax({  
                type : 'get',
                dataType: "json",
                url : './data/login.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
                async : false,
                success : function(data){
                    challenge = getUserData('challenge',data);
                    sys_delay_time = getUserData('delay_time', data);
                    processDelayTime();
                }
            });

		}else if(status == '5'){
			$.ajax({
				type : 'get',
				dataType: "json",
				url : './data/login.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
				async : false,
				success : function(data){
					sys_delay_time = getUserData('delay_time', data);
					sys_encryption_key = getUserData('encryption_key', data);
					
					for(var key in data){
						if(data[key].trying_times !==  undefined){ sys_trying_times = data[key].trying_times; }
						if(data[key].salt !==  undefined){ salt = data[key].salt; }
					}
					
					processDelayTime();
				}
			});
			
        }else if(status == '6'){
						var html = '';
						html += '<div id="message">';
						html += '<div class="buttonsDivider"></div>';
						html += '<div class="row"></div>';
						html += '<div class="message message-error"><span id="lang700243">'+getHTMLString(700243)+'</span></div>'; //Incorrect challenge. Please try again.
						html += '</div>';
						
						var row_length = $('div#rightContent .row').length;
						$('div#rightContent .row').each(function(key, val){
							if(key == (row_length-1)) $(this).after(html);
						});
						$.ajax({  
							type : 'get',
							dataType: "json",
							url : './data/login.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
							async : false,
							success : function(data){
                                                        challenge = getUserData('challenge',data);
                                                        sys_delay_time = 2;
								processDelayTime();
                                                        }
						});

		}else{
			var html = '';
			html += '<div id="message" class="row description">';
			html += '<div class="message message-error left"><span id="lang802036">'+getHTMLString(802036)+'</span></div>'; //The passwords you entered do not match.
			html += '</div>';
			
			var row_length = $('div#activation-content-right .row').length;
			$('div#activation-content-right .row').each(function(key, val){
				if(key == (row_length-1)) $(this).after(html);
			});
		}
	}
}

function processDelayTime(){
	if(false && window.console) console.log("processDelayTime(): " + sys_delay_time + " " + sys_lang_code);
	
	if (sys_delay_time > 0){
		if(false && window.console) console.log("delay " + sys_delay_time);
		
		$('div#activation-content-right').html(page_login_delay_time_HTMLstr(sys_delay_time));
		
		processDelayFunc(sys_trying_times, sys_delay_time);
	}
}

function processDelayFunc(trying_times, delay_time){
	setTimeout(function(){
		delay_time = parseInt(delay_time,10)-1;
		if(delay_time > 0){
			$('div#activation-content-right').html(page_login_delay_time_HTMLstr(delay_time));
			
			processDelayFunc(trying_times, delay_time);
		}else{
			if(false && window.console) console.log("delay end");
			
			if(without_password){ //Login without password
				$('div#activation-content-right').html(page_activation_content_right_without_password_htmlstr());
				page_activation_content_right_without_password_func_load();
			}else{
				$('div#activation-content-right').html(page_activation_content_right_htmlstr());
				page_activation_content_right_func_load();
			}
		}
	},1000);
}

function page_login_delay_time_HTMLstr(time){
	var html = '';
	
	html += '<div class="row">';
	html += '<div class="message message-error">';
	html += '<h2><span class="language-string" style="display:block; width:360px;" name="ACTIVATION_PAGE_STEP_138_ERROR_MESSAGE_TITLE">'+getHTMLString('1310029')+'</span></h2>'; //Wrong Vodafone Router Avanzado Password
	html += '<p></p>';
	html += '<p class="message-error-text">';
	html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_138_ERROR_MESSAGE_TEXT">'+getHTMLString('1310030').replace('30', time)+'</span>'; //Your account is blocked for 30 seconds.
	html += '</p>';
	html += '</div>';
	html += '</div>';
	
	return html;
}	

function popupClose(){
	document.getElementById('popup').style.display="none";
	document.getElementById('blackBackground').style.display="none";
}
//init page end
/*
 * function for textfields
 * to have a placeholder
 * which is only visible if
 * textfield is "empty"
 */
function tglInput (obj, value) {
	if (obj.hasClass('active')) {
		if (obj.val() == '') {
			obj.val(value);
			obj.toggleClass('active');
		}
	} else {
		if (obj.val() == value) {
			obj.val('');
			obj.toggleClass('active');
		}
	}
}

$(document).ready(function(){
	if(!isBrowserDetectSupport()){ top.location.href = "nbrow.html"; }
	if(!areCookiesEnabled()){
		window.parent.location = 'ncoki.html'; //no cookie
	}
   
    $.ajax({  
        type : 'get',
        dataType: "json",
        url : './data/login.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
        async : false,
        success : function(data){
          challenge = getUserData('challenge',data);
          sys_delay_time = getUserData('delay_time', data);
       }
    });

	$.ajax({  
		type : 'get',
		dataType: "json",
		url : './data/user_lang.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
		async : false,
		success : function(data){
			//Invalid filter
			data = filterInvalidString(data);
			
			usermode = getUserData('usermode', data);
			sys_phone_service = getUserData('phone_service', data);
			sys_username = getUserData('username', data);
			sys_dropDownBasExp = getUserData('dropDownBasExp', data);
			sys_pageid = getUserData('pageid', data);
			sys_country = getUserData('country', data);
			sys_lang_code = getUserData('lang_code', data);
		//	sys_delay_time = getUserData('delay_time', data);
			sys_encryption_key = getUserData('encryption_key', data);
			sys_ipv6_status = getUserData('ipv6_status', data);
			sys_ipv6_configuration = getUserData('ipv6_configuration', data);
			sys_info.fw_version = getUserData('fw_version', data);
			sys_info.wan_ip4_addr = getUserData('wan_ip4_addr', data);
			sys_info.wan_ip6_addr = getUserData('wan_ip6_addr', data);
			
			for(var key in data){
				if(data[key].trying_times !==  undefined){ sys_trying_times = data[key].trying_times; }
				if(data[key].salt !==  undefined){ salt = data[key].salt; }
				
				if(data[key].page_blocked !==  undefined){ page_blocked = (data[key].page_blocked === '1'); }
				if(data[key].without_password !==  undefined){ without_password = (data[key].without_password === '1'); }
				if(data[key].credential_detail !==  undefined){ credential_detail = (data[key].credential_detail === '1'); }
			}
			
			if(sys_country == 'TR')
			{
			    if(sys_lang_code == ''){
				    if(usermode == 'admin'){
					 sys_lang_code = 'en_eles';
				}else{
					sys_lang_code = 'tu_eles';
				}
			    }
			}
			else if(sys_country == 'GR'){
			    if(sys_lang_code == ''){
				    if(usermode == 'admin'){
					 sys_lang_code = 'en_eles';
				}else{
					sys_lang_code = 'gr_eles';
				}
			    }
			}
			
			if(page_blocked){
				load_multi_lang_data();
				
				var html = '';
				html += '<div style="width:auto; margin-top: 90px;" class="message-info">';
				html += '<span class="language-string" name="ACTIVATION_PAGE_STEP_109_PAGE_BLOCKED_TEXT">'+getHTMLString('1310028')+'</span>'; //Access Denied: The selected page is not accessible from this Wi-Fi connection
				html += '</div>';
				
				$('#activation-content #activation-content-right').html(html);
			}else{
				page_init();
			}
			
		}
	});
});

function areCookiesEnabled(){
    var cookieEnabled = navigator.cookieEnabled;

    // When cookieEnabled flag is present and false then cookies are disabled.
    if (cookieEnabled === false){
        return false;
    }

    // try to set a test cookie if we can't see any cookies and we're using 
    // either a browser that doesn't support navigator.cookieEnabled
    // or IE (which always returns true for navigator.cookieEnabled)
    if (!document.cookie && (cookieEnabled === null || /*@cc_on!@*/false))
    {
        document.cookie = "testcookie=1";

        if (!document.cookie) {
            return false;
        } else {
            document.cookie = "testcookie=; expires=" + new Date(0).toUTCString();
        }
    }

    return true;
}
