$(document).ready(function(){
	addChosen2Select('#content');
	
	var tmp_min = getHTMLString(1301108);
	var select_obj = document.getElementById('autologout');
	select_obj.length = 0;
	select_obj.options.add(new Option(tmp_min.replace('%s', '5'), "501007"));
	select_obj.options.add(new Option(tmp_min.replace('%s', '10'), "501015"));
	select_obj.options.add(new Option(tmp_min.replace('%s', '15'), "501008"));
	select_obj.options.add(new Option(tmp_min.replace('%s', '30'), "501009"));
	select_obj.options.add(new Option(getHTMLString(501010), "501010"));
	
	page_data_load_password("settings_password");
	transHTMLString();
});

function page_data_load_password(str){
	var JSONSource = './data/'+str+'.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token;
	$.getJSON(JSONSource, function(data) {
		//Invalid filter
		data = filterInvalidString(data);
		
		page_settings_password_load(data);
	});
}

function page_settings_password_load(data){
	$('input.scm-change-pw').removeData();
	
	if(usermode == 'admin'){
		var select_obj = document.getElementById('user_account');
		select_obj.length = 0;
		
		var username;
		var user_id;
		var auto_logout;
        user_id = "";
		$.each(data, function(e_key, e_value){

            username = "";
			$.each(e_value, function(key, val){
				if(key == 'username') username = val;
				if(key == 'user_id') user_id = val;
				if(key == 'auto_logout') auto_logout = val;
			});
			if(username != ""){
				select_obj.options.add(new Option(username, user_id));
			}
		});
		
		$('select#user_account').trigger("chosen:updated");
		$('select#autologout').val(auto_logout).trigger('change').trigger("chosen:updated");
	}else{
		var auto_logout;
		$.each(data, function(e_key, e_value){
			$.each(e_value, function(key, val){
				if(key == 'auto_logout') auto_logout = val;
			});
		});
		
		$('select#autologout').val(auto_logout).trigger('change').trigger("chosen:updated");
	}
	
	$('.message-arrowbox').hide();
	$('.message-arrowbox-applied').hide();
}

$(function () {
	//select
	$('select#autologout').change(function () {
		if(logMessage && window.console) console.log("select change");
		
		$('.message-arrowbox').show();
		$('.message-arrowbox-applied').hide();
	});
	
	//.popup .button-cancel
	$('.popup .button-cancel').on('click', function () {
		if(logMessage && window.console) console.log(".popup .button-cancel click");
		
		$('.popup, .blackBackground').fadeOut();
		
		$('.scm_error_msg').remove();
		$('.message.message-error.not-similiar').hide();
		$('.message.message-error.wrong-password').hide();
		
		$('input').removeClass('input-message-error');
	});
	
	//.popup .button-apply
	$('.popup .button-apply').bind("click",function(){
		if(logMessage && window.console) console.log(".popup .button-apply click");
		
		//Check Validation
		$('.scm_error_msg').remove();
		$('.message.message-error.wrong-password').hide();
		$('.message.message-error.not-similiar').hide();
		
		$('input').removeClass('input-message-error');
		
		
		if(!chkInputTextValidation('.popup input[type="password"]') ){
			
			var element_name = getHTMLString(700044);
			var msg = getHTMLString(700078);
			msg = msg.replace('%s1', element_name);
			msg = msg.replace('% S1', element_name);
			var html = '<div class="scm_error_msg message message-error">'+msg+'</div>';
			$('.popup .apply-cancel').before(html);
		
			return;
		}
		
		if($('.popup .row input.password-input1').val() !== $('.popup .row input.password-input2').val()){
			$('.popup .row input.password-input1, .popup .row input.password-input2').addClass('input-message-error');
			$('.message.message-error.not-similiar').show();
			
			return;
		}
		//Check Validation End
		
		var data_format = [];
		var tmp_data;
		if(usermode == 'admin'){
			tmp_data = {
				user_id:$('#user_account').val(),
				pwd:$('.popup input[type="password"].password-input3').val()
			};
			//data_format.push(
			//	{nameObj : settingsPasswordValidationAdmin, value : sc_sjcl_encrypt(JSON.stringify([tmp_data]))}
			//);
		}else{
			tmp_data = $('.popup input[type="password"].password-input3').val();
			//data_format.push(
			//	{nameObj : settingsPasswordValidation, value : sc_sjcl_encrypt(tmp_data)}  // pwd_validation
			//);
		}
		
		//dataBatchSend(data_format, settingsPasswordValidationRet, 'settings_password');
		
		settingsPasswordValidationRetTrue();
		
		function settingsPasswordValidationRet(data, textStatus, jqXHR){
			if(data=='1'){
				settingsPasswordValidationRetTrue();
			}else{
				var element_name = getHTMLString(700044);
				var msg = getHTMLString(700078);
				msg = msg.replace('%s1', element_name);
				msg = msg.replace('% S1', element_name);
				var html = '<div class="scm_error_msg message message-error">'+msg+'</div>';
				$('.popup .apply-cancel').before(html);
				
				$('.popup .row input.password-input3').addClass('input-message-error');
			}
		}
		
		function settingsPasswordValidationRetTrue(){
			//save data
			var pwd_data = $('input.scm-change-pw').data();
			$('input.scm-change-pw').removeData();
			
			if(usermode == 'admin'){
				tmp_data.pwd = $('.popup input[type="password"].password-input1').val();
				var tmp_ary = [];
				var not_user = true;
				for(var key in pwd_data){
					if(pwd_data[key].user_id === tmp_data.user_id){
						not_user = false;
						pwd_data[key].pwd = tmp_data.pwd;
					}
					if(pwd_data[key].user_id !== undefined){
						tmp_ary.push(pwd_data[key]);
					}
				}
				if(not_user){
					tmp_ary.push(tmp_data);
				}
				
				$('input.scm-change-pw').data(tmp_ary);
			}else{
				$('input.scm-change-pw').data({pwd:$('.popup input[type="password"].password-input1').val()});
			}
			//save data end
			
			$('.message-arrowbox').show();
			$('.message-arrowbox-applied').hide();
					
			$('.popup, .blackBackground').fadeOut();
		}
	});
	
	//.popup input.password-input1
	$('.popup input.password-input1').keyup(function(){
		if(logMessage && window.console) console.log(".popup input.password-input1 keyup");
		
		var pwd = $(this).val();
		var obj = $(this).closest('.popup').find('.passwordStrength');
		passwordStrength(pwd, obj);
	});
	
	//.scm-change-pw
	$('.scm-change-pw').bind("click",function(){
		if(logMessage && window.console) console.log(".scm-change-pw click");
		
		$('.scm_error_msg').remove();
		$('.message.message-error.wrong-password').hide();
		$('.message.message-error.not-similiar').hide();
		
		$('input').removeClass('input-message-error');
		
		$('.popup input[type=password]').val('');
		
		var obj = $('.popup').find('.passwordStrength');
		passwordStrength('', obj);
			
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup.password-popup1, .blackBackground').fadeIn();
		
	});
	
	//#cancelButton
	$('#cancelButton').bind("click",function(){
		if(logMessage && window.console) console.log('#cancelButton click');
		
		//loginUserChkLoginTimeout.set_sjcl(sys_username, loginUserChkLoginTimeoutRet, 'login');
		loginUserChkLoginTimeout.set(sys_username, loginUserChkLoginTimeoutRet, 'login');
		
		$('.message-arrowbox').hide();
		$('.message-arrowbox-applied').hide();
		
		//reload
		page_data_load_password("settings_password");
	});
	
	//#applyButton
	$('#applyButton').bind("click",function(){
		if(logMessage && window.console) console.log('#applyButton click');
		
		if($('[name="PAGE_FIREWALL_WARNING_APPLY_OR_CANCEL"]').closest('.message-arrowbox').css('display') != 'block') return; //no any change
		
		//disabled button
		$('#cancelButton').attr('disabled', 'disabled');
		$('#applyButton').attr('disabled', 'disabled');
		
		var pwd_data = $('input.scm-change-pw').data();
//		var pwd_changed = false;
		$('input.scm-change-pw').removeData();
		var tmp_autologout = $('select#autologout').val();
		
		var data_format = [
			{nameObj : settingsPasswordAutoLogout, value : tmp_autologout} //auto logout
		];
		
		if(usermode == 'admin'){
			var out_str = [];
			for(var key in pwd_data){
				if(pwd_data[key].pwd !== undefined){
					out_str.push(pwd_data[key]);
				}
			}
			
			if(out_str.length > 0){
//				pwd_changed = true;
				
				data_format.push(
					{nameObj : settingsPasswordUserData, value : sc_sjcl_encrypt(JSON.stringify(out_str))} //PasswordUserData
				);
			}
		}else{
			if(pwd_data.pwd !== undefined){
//				pwd_changed = true;
				
				data_format.push(
					{nameObj : settingsPasswordPWD, value : sc_sjcl_encrypt(pwd_data.pwd)} //pwd
				);
			}
		}
		dataBatchSend(data_format, setSettingsPasswordRet, 'settings_password');
		
		function setSettingsPasswordRet(data, textStatus, jqXHR){
//			if(pwd_changed && sys_is_default_password && usermode !== 'admin'){
//				window.parent.location = 'login.html';
//			}
			
			if(data=='1'){
				$('.message-arrowbox').hide();
				$('.message-arrowbox-applied').show();
			}
            else
				$('.message-arrowbox').hide();
	    //enabled button
			$('#cancelButton').removeAttr('disabled');
			$('#applyButton').removeAttr('disabled');
		}
		
	});
	
	//.scm-reset-pw
	$('.scm-reset-pw').bind("click",function(){
		if(logMessage && window.console) console.log(".scm-reset-pw click");
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title tL">';
		html += '<span class="language-string" name="PAGE_PASSWORD_RESET_PW_POPUP_TITLE">'+getHTMLString('PAGE_PASSWORD_RESET_PW_POPUP_TITLE')+'</span>'; //Reset Password
		html += '</p>';
		html += '<div class="h3-content no-padding-left no-padding-bottom">';
		html += '<div class="row">';
		html += '<div class="left">';
		html += '<span class="language-string" name="PAGE_PASSWORD_RESET_PW_POPUP_TXT">'+getHTMLString('PAGE_PASSWORD_RESET_PW_POPUP_TXT')+'</span>'; //Are you sure you want to reset the password?
		html += '</div>';
		html += '</div>';
		html += '</div>      ';  
		html += '<div class="apply-cancel">';
		html += '<input type="button" class="button button-apply" value="'+getHTMLString('PAGE_PASSWORD_RESET_PW_POPUP_CONFIRM')+'"> '; //Confirm
		html += '<input type="button" class="button button-cancel" value="'+getHTMLString('PAGE_PASSWORD_RESET_PW_POPUP_CANCEL')+'">'; //Cancel
		html += '</div>';
		
		$('.popup.reset-password').html(html);
		
		//.button-cancel
		$('.button-cancel', '.popup.reset-password').on("click",function(){
			if(logMessage && window.console) console.log(".button-cancel click");
			
			$('.popup, .blackBackground').fadeOut();
		});
		
		//.button-apply
		$('.button-apply', '.popup.reset-password').on("click",function(){
			if(logMessage && window.console) console.log(".button-apply click");
			
			//disabled button
			$('.scm-reset-pw').attr('disabled', 'disabled');
			
			var tmp_id = $('#user_account').val();
			
			var data_format = [
				{nameObj : settingsPasswordResetPWDByID, value : tmp_id} // reset_pwd_by_id
			];
			
			dataBatchSend(data_format, settingsPasswordResetPWDByIDRet, 'settings_password');
			
			function settingsPasswordResetPWDByIDRet(data, textStatus, jqXHR){
				if(data){
					$('.message-arrowbox').hide();
					$('.message-arrowbox-applied').hide();
					
					$('.scm-reset-pw').removeAttr('disabled');
					
					//reload
					page_data_load_password("settings_password");
				}
				
				$('.popup, .blackBackground').fadeOut();
			}
		});
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup.reset-password, .blackBackground').fadeIn();
	});
});

/*function showMsg_defaultPWD(){
	html = '';
	html += '<div id="showMsg_defaultPWD" class="head-message clearfix">';
	html += '<div class="fL"><span>'+getHTMLString(1300087)+'</span></div>'; //You are still using the default password. To prevent unwanted users connecting, you should change it.
	html += '</div>';
	
	$('header#header nav').after(html);
	
}*/
