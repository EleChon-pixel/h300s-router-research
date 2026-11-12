var debug_mode = false;
var logMessage = false;
var sys_sjcl_enable = false;

var usermode = '';
var sys_phone_service = true;
var sys_usb_status = true;
var sys_iptv_status = true;
var sys_fon_status = true;
var sys_umts_status = true;
var sys_ipv6_status = true;
var sys_band_steering = true;
var sys_sfp_status = true;
var sys_vodafone_safe_netwok = false;
var sys_ipv6_configuration = true;
var sys_11ac_status = true;
//var sys_is_default_password = false;
var sys_username = '';
var sys_userprofile = '';
var sys_dropDownBasExp = '';
var sys_pageid = '';
var sys_country = '';
var sys_syz_fw = '';
var sys_lang_code = '';
var sys_delay_time = 0;
var sys_encryption_key = '';
var sys_logged_in_users = '';
var sys_dsl_debug_enable = '';
var sys_fw_version = '';
var sys_mobile_support = true;
var sys_info = {};
var reset_pages_ary = [];
var windowWidth = $(window).width();

jQuery.extend({
	getJSON2: function( url, callback ) {
		return jQuery.get( url, null, function( data ) {
			//sjcl decrypt
			//data = sjcl.decrypt(getWebStorage("dk"), data);
			//sjcl decrypt end
			
			data = jQuery.parseJSON(data);
			callback(data);
		}, "text" );
	}
});

function main_init(page){
	if(self == top) {
		document.documentElement.style.display = 'block'; 
	} else {
		top.location = self.location; 
	}

	$.ajax({  
		type : 'get',
		dataType: "json",
		url : './data/user_data.json?_=' + new Date().getTime() + "&csrf_token=" + csrf_token,
		async : false,
		success : function(data){
			//Invalid filter
			data = filterInvalidString(data);
			
			usermode = getUserData('usermode', data);
			//sys_phone_service = getUserData('phone_service', data);
			sys_usb_status = getUserData('usb_status', data);
			sys_iptv_status = getUserData('iptv_status', data);
			sys_fon_status = getUserData('fon_status', data);
			sys_umts_status = getUserData('umts_status', data);
			sys_ipv6_status = getUserData('ipv6_status', data);
			sys_band_steering = getUserData('band_steering', data);
			sys_sfp_status = getUserData('sfp_status', data);
			sys_vodafone_safe_netwok = getUserData('vodafone_safe_netwok', data);
			sys_ipv6_configuration = getUserData('ipv6_configuration', data);
			sys_11ac_status = getUserData('11ac_status', data);
//			sys_is_default_password = getUserData('is_default_password', data);
			sys_username = getUserData('username', data);
			sys_userprofile = getUserData('userprofile', data);
			sys_dropDownBasExp = getUserData('dropDownBasExp', data);
			sys_pageid = getUserData('pageid', data);
			sys_country = getUserData('country', data);
			sys_syz_fw = getUserData('syze_fw', data);
			sys_lang_code = getUserData('lang_code', data);
			sys_logged_in_users = getUserData('logged_in_users', data);
			sys_dsl_debug_enable = getUserData('dsl_debug_enable',data);
			sys_debug_fw = getUserData('debug_fw',data);
			sys_mobile_support = getUserData('mobile_support', data);
			sys_info.fw_version = getUserData('fw_version', data);
			sys_info.wan_ip4_addr = getUserData('wan_ip4_addr', data);
			sys_info.wan_ip6_addr = getUserData('wan_ip6_addr', data);
			
			if(sys_country == 'TR')
			{
			    if(sys_lang_code == ''){
					    sys_lang_code = 'tu_eles';
			    }
			}else if(sys_country == 'GR'){
			    if(sys_lang_code == ''){
					    sys_lang_code = 'gr_eles';
			    }

			}
			if(!(sys_phone_service || (usermode == 'admin'))){
				var tmp_class = $("#look_4").attr("class").split(" ");
				for(var key in tmp_class){
					if(tmp_class[key].indexOf("navigation") !== -1){
						var tmp_val = tmp_class[key].split("-")[1].split("of");
						
						var tmp_val_0 = (parseInt(tmp_val[0],10)-1 === 0)?"1":(parseInt(tmp_val[0],10)-1);
						var tmp_val_1 = parseInt(tmp_val[1],10)-1;
						
						$("#look_4").removeClass(tmp_class[key]);
						$("#look_4").addClass("navigation-"+tmp_val_0+"of"+tmp_val_1);
					}
				}
			}
				page_data_init(page);
		}
	});
}

function userLogoutSetRet(data, textStatus, jqXHR){
	if(data == "1"){
		window.parent.location = 'index.htm';
	}
}

function page_data_init(page){
	//disable baisc mode
	sys_dropDownBasExp = (sys_dropDownBasExp === 'expert') ? sys_dropDownBasExp:'expert';
	//sys_dropDownBasExp = (sys_dropDownBasExp === 'expert') ? sys_dropDownBasExp:'basic';
	//disable baisc mode end
	var dropDownBasExp = sys_dropDownBasExp;
	var dsl_debug_enable = sys_dsl_debug_enable;
	var debug_fw = sys_debug_fw;
	if(usermode == 'admin'){ dropDownBasExp = usermode; }
	
	if(dropDownBasExp == ''){
		sys_dropDownBasExp = "basic";
		chkPageSelect(page, "basic",dsl_debug_enable,debug_fw);
		load_multi_lang_data();
		header_init(page, "basic");
		mobile_header_init(page, "basic",dsl_debug_enable,debug_fw);
		$('#subnavigation').html(navigation_init(page, "basic",dsl_debug_enable,debug_fw));
	}else{
		chkPageSelect(page, dropDownBasExp,dsl_debug_enable,debug_fw);
		load_multi_lang_data();
		header_init(page, dropDownBasExp);
		mobile_header_init(page, dropDownBasExp,dsl_debug_enable,debug_fw);
		$('#subnavigation').html(navigation_init(page, dropDownBasExp,dsl_debug_enable,debug_fw));
	}
	
	if(!(sys_phone_service || (usermode == 'admin'))){
		$("#subnavigation [class^=subnavigation-]").each(function(){
			var tmp_val = $(this).attr("class").split("-")[1].split("of");
				
			var tmp_val_0 = (parseInt(tmp_val[0],10)-1 === 0)?"1":(parseInt(tmp_val[0],10)-1);
			var tmp_val_1 = parseInt(tmp_val[1],10)-1;
			
			$(this).removeClass();
			$(this).addClass("subnavigation-"+tmp_val_0+"of"+tmp_val_1);
		});
	}
	
	//reset
	_get_reset_pages_status();
	
	//.resetButtonsShort
	$('.resetButtonsShort').on('click', function(){
		if(false && window.console) console.log(".resetButtonsShort click");
		
		$('.resetButtonsShort').hide();
		$('.resetBar').animate({ height: 'show' });
		
		//set title(mobile)
		$('.resetBar h3.page-title-container').text($('#content h1').first().text());
	});
	
	//.cancelR
	$('.cancelR').on('click', function(){
		if(false && window.console) console.log(".cancelR click");
		
		$('.resetBar').animate({ height: 'hide' }, function(){
			$('.resetButtonsShort').fadeIn();
		});
	});
	
	//.resetR
	$('.resetR').on('click', function(){
		if(false && window.console) console.log(".resetR click");
		
		var tmp_id = _get_pages_reset_id_by_hashid(_get_pages_hashid());
		
		resetPages_reset_page.set(tmp_id, resetPages_reset_pageRet, 'reset_pages');
	});
	//reset end
	
	//lang
	var html_out = "";
	if(sys_country == 'TR'){
	html_out += '<li class="language-switcher"><a href="javascript:lang_change(\'en_eles\');">English</a></li>';
	html_out += '<li class="language-switcher"><a href="javascript:lang_change(\'tu_eles\');">Turkish</a></li>';
	} else if(sys_country == 'GR'){
	html_out += '<li class="language-switcher"><a href="javascript:lang_change(\'en_eles\');">English</a></li>';
	html_out += '<li class="language-switcher"><a href="javascript:lang_change(\'gr_eles\');">Greek</a></li>';
	}
	$('#language-switcher-list').html(html_out);
	
	//fw version & ip4/ip6 addr
	var html_out = "";
	html_out += '<span class="language-string">'+getHTMLString(1310025).replace('%s', sys_info.fw_version)+'</span><br>'; //Firmware version: %s
	html_out += '<span class="language-string">'+getHTMLString(1310026).replace('%s', sys_info.wan_ip4_addr)+'</span><br>'; //WAN IPv4 Address: %s
	if(sys_ipv6_status && sys_ipv6_configuration){
		html_out += '<span class="language-string">'+getHTMLString(1310027).replace('%s', sys_info.wan_ip6_addr)+'</span>'; //WAN IPv6 Address: %s
	}
	$('#info').html(html_out);
	
	GMSG_get_global_msg_status();
	
	$(window).resize(function(){
		if ($(window).width() != windowWidth) {
			windowWidth = $(window).width();
			
			$('.window_resize').trigger('pre_window_resize');
			
			clearTimeout(window.resizedFinished);
			window.resizedFinished = setTimeout(function(){
				$('.window_resize').trigger('window_resize');
			}, 100);
			
		}
	});
	
	$('#navigation a, #top-bar-content a').click(function(){
		if(chkUserDataModification()) return false;
	});
	
	$('select.dropdown').chosen({
		disable_search_threshold: 100000,
		allow_single_deselect: true
	}).on('change', function(){
		if($(this).val() === "basic"){
			setUserData("dropDownBasExp","basic");
		}else if($(this).val() === "expert"){
			setUserData("dropDownBasExp","expert");
		}else if($(this).val() === "admin"){
			setUserData("dropDownBasExp","admin");
		}else if($(this).val() === "logout"){
			$('#logout').trigger("click");
		}
	})/*.on('chosen:showing_dropdown', function(){
		if(chkUserDataModification()) return false;
		
		if($(this).val() === "logout"){
			$('#logout').trigger("click");
		}
	}).on('chosen:hiding_dropdown', function(){
		if(chkUserDataModification()) return false;
		
		if($(this).val() === "logout"){
			$('#logout').trigger("click");
		}
	})*/;
	
	$('#logout').on("click", function(){
		if(chkUserDataModification()) return false;
		
		delCookie('dropDownBasExp');
		delCookie('pageid');
		delCookie('username');
		delCookie('lang_code');
		
		userLogout.set('1', userLogoutSetRet, 'login');
	//	window.parent.location = 'login.html';
	});
	
	//mobile
	$('a.mobile-navigation-item-title').on("click", function(){
		if(false && window.console) console.log("a.mobile-navigation-item-title click");
		
		var tmp_obj = $(this).closest('li');
		var tmp_first_item = tmp_obj.hasClass('first-item');
		var tmp_active = tmp_obj.hasClass('active');
		if(tmp_first_item){ //overview page
			if(chkUserDataModification()) return false;
			
			$('body').removeClass('menu-overlay-active');
			return true;
		}
		
		$('li.main-item').removeClass('active');
		
		if(!tmp_active){
			tmp_obj.addClass('active');
		}
	});
	
	$('li.mobile-navigation-item > a, li.navigation-item > a').on("click", function(){
		if(false && window.console) console.log("li.mobile-navigation-item > a, li.navigation-item > a click");
		
		if(chkUserDataModification()) return false;
		
		$('body').removeClass('menu-overlay-active');
	});
	
	$('a.mobile_logout').on("click", function(){
		$('body').removeClass('menu-overlay-active');
		$('#logout').trigger("click");
	});
	
	$('#mobile-header .hamburger-menu, #mobile-menu-overlay .hamburger-menu').on('click', function(){
		if(false && window.console) console.log("#mobile-header .hamburger-menu, #mobile-menu-overlay .hamburger-menu click");
		
		$('body').toggleClass('menu-overlay-active');
	});
	
	$('.warning-messages, #content-wrap').on('click', function(){
		if(false && window.console) console.log(".warning-messages, #content-wrap click");
		
		if($('body').hasClass('menu-overlay-active')){
			$('body').removeClass('menu-overlay-active');
		}
	});
	//mobile end
	
	if(page == "overview"){
		page_overview_init();
	}else{
		page_data_load(page);
	}
}

function getUserData(name, data){
	var tmp_phone_service = true;
	var tmp_usb_status = true;
	var tmp_iptv_status = true;
	var tmp_fon_status = true;
	var tmp_umts_status = true;
	var tmp_ipv6_status = true;
	var tmp_band_steering = true;
	var tmp_sfp_status = true;
	var tmp_vodafone_safe_netwok = false;
	var tmp_ipv6_configuration = true;
	var tmp_11ac_status = true;
//	var tmp_is_default_password = false;
	var tmp_username = '';
	var tmp_usermode = '';
	var tmp_userprofile = '';
	var tmp_pageid = '';
	var tmp_dropDownBasExp = '';
	var tmp_country = '';
	var tmp_syze_fw = '';
	var tmp_lang_code = '';
	var tmp_delay_time = '';
	var tmp_encryption_key = '';
	var tmp_logged_in_users = '';
	var tmp_dsl_debug_enable = '';
	var tmp_debug_fw = '';
	var tmp_mobile_support = false;
	var tmp_fw_version = '';
	var tmp_wan_ip4_addr = '';
	var tmp_wan_ip6_addr = '';
    var challenge = '';
	
	$.each(data, function(main_key, main_val) {
		$.each(main_val, function(key, val) {
			if(key == "phone_service"){
				if(val == '1') tmp_phone_service = true;
				else tmp_phone_service = false;
			}
			if(key == "usb_status"){
				if(val == '1') tmp_usb_status = true;
				else tmp_usb_status = false;
			}
			if(key == "iptv_status"){
				if(val == '1') tmp_iptv_status = true;
				else tmp_iptv_status = false;
			}
			if(key == "fon_status"){
				if(val == '1') tmp_fon_status = true;
				else tmp_fon_status = false;
			}
			if(key == "umts_status"){
				if(val == '1') tmp_umts_status = true;
				else tmp_umts_status = false;
			}
			if(key == "ipv6_status"){
				if(val == '1') tmp_ipv6_status = true;
				else tmp_ipv6_status = false;
			}
			if(key == "band_steering"){
				if(val == '1') tmp_band_steering = true;
				else tmp_band_steering = false;
			}
			if(key == "sfp_status"){
				if(val == '1') tmp_sfp_status = true;
				else tmp_sfp_status = false;
			}
			if(key == "vodafone_safe_netwok"){
				if(val == '1') tmp_vodafone_safe_netwok = true;
				else tmp_vodafone_safe_netwok = false;
			}
			if(key == "ipv6_configuration"){
				if(val == '1') tmp_ipv6_configuration = true;
				else tmp_ipv6_configuration = false;
			}
			if(key == "11ac_status"){
				if(val == '1') tmp_11ac_status = true;
				else tmp_11ac_status = false;
			}
//			if(key == "is_default_password"){
//				tmp_is_default_password = (val == '1')? true : false;
//			}
			
			if(key == "username") tmp_username = val;
			if(key == "usermode") tmp_usermode = val;
			if(key == "userprofile") tmp_userprofile = val;
			if(key == "pageid") tmp_pageid = val;
			if(key == "dropDownBasExp") tmp_dropDownBasExp = val;
			if(key == "country") tmp_country = val;
			if(key == "syze_fw") tmp_syze_fw = val;
			if(key == "lang_code") tmp_lang_code = val;
			if(key == "delay_time") tmp_delay_time = val;
			if(key == "encryption_key") tmp_encryption_key = val;
			if(key == "logged_in_users") tmp_logged_in_users = val;
			if(key == "dsl_debug_enable") tmp_dsl_debug_enable = val;
			if(key == "debug_fw") tmp_debug_fw = val;
			if(key == "mobile_support") tmp_mobile_support = (val == '1');
			if(key == "fw_version") tmp_fw_version = val;
			if(key == "wan_ip4_addr") tmp_wan_ip4_addr = val;
			if(key == "wan_ip6_addr") tmp_wan_ip6_addr = val;
			if(key == "challenge") challenge = val;
		});
	});
	if(name == 'phone_service') return tmp_phone_service;
	if(name == 'usb_status') return tmp_usb_status;
	if(name == 'iptv_status') return tmp_iptv_status;
	if(name == 'fon_status') return tmp_fon_status;
	if(name == 'umts_status') return tmp_umts_status;
	if(name == 'ipv6_status') return tmp_ipv6_status;
	if(name == 'band_steering') return tmp_band_steering;
	if(name == 'sfp_status') return tmp_sfp_status;
	if(name == 'vodafone_safe_netwok') return tmp_vodafone_safe_netwok;
	if(name == 'ipv6_configuration') return tmp_ipv6_configuration;
	if(name == '11ac_status') return tmp_11ac_status;
//	if(name == 'is_default_password') return tmp_is_default_password;
	if(name == 'username') return tmp_username;
	if(name == 'usermode') return tmp_usermode;
	if(name == 'userprofile') return tmp_userprofile;
	if(name == 'pageid') return tmp_pageid;
	if(name == 'dropDownBasExp') return tmp_dropDownBasExp;
	if(name == 'country') return tmp_country;
	if(name == 'syze_fw') return tmp_syze_fw;
	if(name == 'lang_code') return tmp_lang_code;
	if(name == 'delay_time') return tmp_delay_time;
	if(name == 'encryption_key') return tmp_encryption_key;
	if(name == 'logged_in_users') return tmp_logged_in_users;
	if(name == 'dsl_debug_enable') return tmp_dsl_debug_enable;
	if(name == 'debug_fw') return tmp_debug_fw;
	if(name == 'mobile_support') return tmp_mobile_support;
	if(name == 'fw_version') return tmp_fw_version;
	if(name == 'wan_ip4_addr') return tmp_wan_ip4_addr;
	if(name == 'wan_ip6_addr') return tmp_wan_ip6_addr;
	if(name == 'challenge') return challenge;
}

function setUserData(data, val){
	if(chkUserDataModification()) return false;
	
	if(data == 'dropDownBasExp'){
		sys_dropDownBasExp = val;
		userDataDropDownBasExp.set(val, userDataDropDownBasExpRet, "user_data");
	}
	if(data == 'pageid'){
		sys_pageid = val;
		userDataPageId.set(val, null, "user_data");
	}
	if(data == 'lang_code'){
		sys_lang_code = val;
		userDataLangCode.set(val, userDataLangCodeRet, "user_data");
	}

}

function setUserLang(data, val){
	if(data == 'lang_code'){
		sys_lang_code = val;
		userDataLangCode.set(val, userDataLangCodeRet, "user_lang");
	}
}

function setWebStorage(c_name, value){
	if(typeof(Storage) !== "undefined"){
		sessionStorage.setItem(c_name, value);
	}else{
		setCookie(c_name, value, 1);
	}
}

function getWebStorage(c_name){
	if(typeof(Storage) !== "undefined"){
		return sessionStorage.getItem(c_name);
	}else{
		return getCookie(c_name);
	}
}

function setCookie(c_name,value,exdays){
	//alert(c_name + ":" + value);
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name){
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1)
	  {
	  c_start = c_value.indexOf(c_name + "=");
	  }
	if (c_start == -1)
	  {
	  c_value = null;
	  }
	else
	  {
	  c_start = c_value.indexOf("=", c_start) + 1;
	  var c_end = c_value.indexOf(";", c_start);
	  if (c_end == -1)
	  {
	c_end = c_value.length;
	}
	c_value = unescape(c_value.substring(c_start,c_end));
	}
	return c_value;
}

function delCookie(c_name){
	var exdate=new Date();
	exdate.setDate(exdate.getDate() -1);
	var value = getCookie(c_name);
	var c_value=escape(value) + "; expires="+exdate.toUTCString();
	document.cookie=c_name + "=" + c_value;
}

function in_array(stringToSearch, arrayToSearch) {
	for (s = 0; s < arrayToSearch.length; s++){
		thisEntry = arrayToSearch[s].toString();
		if (thisEntry == stringToSearch){
			return true;
		}
  } 
  return false;
}

function isBrowserDetectSupport(){
	navigator.sayswho= (function(){
		var ua= navigator.userAgent, tem, 
		M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
		if(/trident/i.test(M[1])){
			tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
			return 'IE '+(tem[1] || '');
		}
		if(M[1]=== 'Chrome'){
			tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
			if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
		}
		M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
		if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
		return M.join(' ');
	})();
	
	if(navigator.sayswho.indexOf('MSIE') !== -1){
		var tmp_version = parseInt(navigator.sayswho.replace('MSIE ', ''), 10);
		
		if(tmp_version < 8){
			return false;
		}
	}
	
	return true;
}

function loginUserChkLoginTimeoutRet(data, textStatus, jqXHR){
	if(data.length < 3){
		window.parent.location = 'login.html';
	}else{
		var status = data.slice(0,3);
		if(status != "[ ]"){
			window.parent.location = 'login.html';
		}
	}
}

function userDataDropDownBasExpRet(data, textStatus, jqXHR){
	if(data == "1"){
		location.reload();
	}
}

function userDataLangCodeRet(data, textStatus, jqXHR){
	if(data == "1"){
		location.reload();
	}
}

function addChosen2Select(obj) {
	$('select', obj).chosen({
		disable_search_threshold: 100000,
		allow_single_deselect: true
	});
}

function chkUserDataModification(){
	var modify_msg = $('[name="PAGE_FIREWALL_WARNING_APPLY_OR_CANCEL"]').closest('.message-arrowbox').css('display')
	//alert(modify_msg);
	
	if(modify_msg == undefined) return false;
	if(modify_msg != 'none'){
		$('body').removeClass('menu-overlay-active');
		$('body, html').animate({ scrollTop: $('body').height() });
		
		return true;
	}else{
		return false;
	}
}

function scrollTopByObject(obj){
	return (obj.offset().top-100) + 'px';
}

function isFontElementOverflow(obj){
	var _hasScrollBar = false; 
	if ((obj.clientHeight < obj.scrollHeight) || (obj.clientWidth < obj.scrollWidth)) {
		_hasScrollBar = true;
	}
	return _hasScrollBar;
}

function isThisValNoMask(maskVal, thisVal){
	if(maskVal == 'NaN' || maskVal < 0 || maskVal.length > 8) return true;
	if(thisVal == 'NaN' || thisVal < 0 || thisVal.length > 8) return true;
	
	var maskVal_ary = Array();
	var thisVal_ary = Array();
	
	for(var i = maskVal.length; i > 0; i--){
		maskVal_ary.push(maskVal.slice(i-1, i));
	}
	for(var i = 8-maskVal.length; i > 0; i--){
		maskVal_ary.push('0');
	}
	
	for(var i = thisVal.length; i > 0; i--){
		thisVal_ary.push(thisVal.slice(i-1, i));
	}
	for(var i = 8-thisVal.length; i > 0; i--){
		thisVal_ary.push('0');
	}
	
	for(var key in maskVal_ary){
		if(maskVal_ary[key] == '0' && thisVal_ary[key] == '1') return true;
	}
	
	return false;
}

function getScriptByArray(ary, ret_func){
	if(ary.length != 0){
		var tmp_getScript = ary.pop();
		$.getScript(tmp_getScript + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token, function(response, status) {
			if(ary.length == 0){
				if(ret_func != null){
					ret_func(response, status);
				}
			}else{
				getScriptByArray(ary, ret_func);
			}
		});
	}
}

function chkIsSysType(val){
	if(sys_type === val){
		return true;
	}else{
		return false;
	}
}

function chkIsNotSysType(val){
	if(sys_type !== val){
		return true;
	}else{
		return false;
	}
}

function passwordStrength(password, obj){
	var desc = new Array();
	desc[0] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_WEAK")+'</span>'; //Very Weak //Weak
	desc[1] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_WEAK")+'</span>'; //Weak //Weak
	desc[2] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_GOOD")+'</span>'; //Better //Good
	desc[3] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_GOOD")+'</span>'; //Medium //Good
	desc[4] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_STRONG")+'</span>'; //Strong //Strong
	desc[5] = '<span>'+getHTMLString("PAGE_GENERAL_PASSWORD_STRENGTH_STRONG")+'</span>'; //Strongest //Strong
	var score = 0;
	
	//if password bigger than 6 give 1 point
	if (password.length > 6) score++;
	
	//if password has both lower and uppercase characters give 1 point      
	if ( ( password.match(/[a-z]/) ) && ( password.match(/[A-Z]/) ) ) score++;
	
	//if password has at least one number give 1 point
	if (password.match(/\d+/)) score++;
	
	//if password has at least one special caracther give 1 point
	if ( password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/) ) score++;
	
	//if password bigger than 12 give another 1 point
	if (password.length > 12) score++;
	
	
	if(typeof(obj) != 'object'){
		return false;
	}else{
		obj.html(desc[score]).removeClass().addClass('passwordStrength strength' + score);
		return true;
	}
}



//reset
function _get_reset_pages_status(){
	var JSONSource   = './data/reset_pages.json?_='+ new Date().getTime() + '&csrf_token=' + csrf_token;
	$.getJSON(JSONSource, function(data) {
		//Invalid filter
		data = filterInvalidString(data);
		
		reset_pages_ary = data[0].reset_pages.split(',');
		
		var tmp_id = _get_pages_reset_id_by_hashid(_get_pages_hashid());
		if(tmp_id !== '' && in_array(tmp_id, reset_pages_ary)){
			$('.resetButtonsShort').show();
			$('.resetBar').hide();
		}else{
			$('.resetButtonsShort').hide();
			$('.resetBar').hide();
		}
	});
}

function resetPages_reset_pageRet(data, textStatus, jqXHR){
	if(data == "1"){
		location.reload();
	}
}

function _get_pages_hashid(){
	var tmp_hashid = '';
	var tmp_class = $('#content').attr('class').split(' ');
	
	for(var key in tmp_class){
		if(tmp_class[key].indexOf('sub') !== -1){
			tmp_hashid = tmp_class[key].replace('sub', '');
		}
	}
	
	return tmp_hashid;
}

function _get_pages_reset_id_by_hashid(hashid){
	var ret_id = '';
	var locationInfo = window.location.toString().split("#");
	var pageId = locationInfo[1];
	if(typeof(pageId) !== 'undefined'){
		var navigation = [];
			if(sys_dropDownBasExp == "basic"){
				navigation = _obj_navigation_basic();
			}else if(sys_dropDownBasExp == "expert"){
				navigation = _obj_navigation_expert();
			}
	}
	
	ret_id = _get_array_id_by_hashid(hashid, navigation);
	
	return ret_id;
}

function _get_array_id_by_hashid(hashid, array){
	var ret_id = '';
	var submenu_ret_id = '';
	
	for(var key in array){
		if(array[key].hashid === hashid){
			ret_id = array[key].id;
		}else{
			if(array[key].submenu.length !== 0){
				submenu_ret_id = _get_array_id_by_hashid(hashid, array[key].submenu);
				if(submenu_ret_id !== ''){
					ret_id = submenu_ret_id;
				}
			}
		}
	}
	
	return ret_id;
}

// check the password input, it must contain lower case and upper case letters and at lease one of number
function passwordInvalidChk(val){
    // valid password chars list 
    var rege = /^[!"#$%&'()*+,-./\\0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~]*$/;

    var result = true, i;
    if (rege.length > 0)
    {
        for (i = 0; i < rege.length && result;i++)
            result = rege[i].test(val);
    }
    else 
        result = rege.test(val);

    if(result == false)
        return false;

    if ( ( val.match(/[a-z]/)) && ( val.match(/[A-Z]/)) && (val.match(/\d+/)) )
         return true;
    else
        return false; 
	
}

//Validation
function inputFormateValidateion(val){
	//if(val == "") return false;
	
	var rege = /[&'"//\\\[\]\{\}\(\):;|=,+*?<>]/;
	if(rege.test(val)) return false;
	else return true;
}

function inputNotEmptyFormate2Validateion(val){
	if(val == "") return false;
	
	var rege = /[&'"//\\\[\]\{\}\(\);|=,+*?<>]/;
	if(rege.test(val)) return false;
	else return true;
}

function inputNotEmptyFormateValidateion(val){
	if(val == "") return false;
	
	var rege = /[&'"//\\\[\]\{\}\(\):;|=,+*?<>]/;
	if(rege.test(val)) return false;
	else return true;
}

function timeFormateValidateion(time){
		// check colum in between
		timeAry = time.split(":");
		if(timeAry.length != 2) return false;
		
		// check both are integers
		if(isNaN(timeAry[0])) return false;
		if(isNaN(timeAry[1])) return false;
		
		var hour = parseInt(timeAry[0]);
		var min = parseInt(timeAry[1]);		
		// check if hour field in right range
		if(hour<0 || hour>23) return false;
		// check if the min field in right range
		if(min<0 || min>59) return false;
		
		// check passed
		return true;
}

function phoneFormateValidateion(val){
	if(/^\+?\d+$/.test(val)) return true;
	else return false;
}

function ipv4FormateValidateion(val){
	if(val == "") return false;
	
	if(val.length <= 3){
		if(/^[0-9]*$/.test(val)){
			var tmp_val = parseInt(val, 10);
			if(tmp_val <= 255 && tmp_val >= 0){
				return true;
			}else{
				return false;
			}
		}else{
			return false;
		}
	}else{
		return false;
	}
}

function macSegmentormateValidateion(val){
	if(val == "" || val.length < 2) return false;
	
	var rege = /[0-9a-fA-F]+$/;
	if(rege.test(val[0]) && rege.test(val[1])) return true;
	else return false;
}

function macStringValidateion(val){
	if(val == "") return true;
	var rege = /[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}:[A-F\d]{2}/;
	if(rege.test(val)) return true;
	else return false;
}

function numberFormateValidateion(val){
	if(val == "") return true;
	
	if(/^\d+$/.test(val)){
		var tmp_val = parseInt(val, 10);
		if(tmp_val <= 0)
			return false;
		else
			return true;
	}
	else return false;
}

function numberNotEmptyFormateValidateion(val){
	if(/^\d+$/.test(val)){
		var tmp_val = parseInt(val, 10);
		if(tmp_val <= 0)
			return false;
		else
			return true;
	}
	else return false;
}

function signedINTFormateValidateion(val){
	if(val == "") return false;
	
	if(/^-?\d+$/.test(val)) return true;
	else return false;
}

function unsignedINTFormateValidateion(val){
	if(val == "") return false;
	
	if(/^\d+$/.test(val)) return true;
	else return false;
}

function portFormateValidateion(val){
	if(val == "") return false;

    if(/[a-z]/i.test(val))
	return false;

    if(/\d+$/.test(val)){
        var tmp_val = parseInt(val, 10);
        if(tmp_val < 1 || tmp_val > 65535)
            return false;
        else
            return true;
    }
	else return false;
}

function timeRangeValidation(timeA, timeB){
		if(timeToMin(timeB) < timeToMin(timeA)) return false;
		return true;
}
	
function timeRangeInterfierValidation(rangeAstart, rangeAend, rangeBstart, rangeBend){
		rangeAstartMin = timeToMin(rangeAstart);
		rangeAendMin = timeToMin(rangeAend)-1;
		if(rangeAendMin<rangeAstartMin)
		    rangeAendMin=rangeAendMin+24*60;
		rangeBstartMin = timeToMin(rangeBstart);
		rangeBendMin = timeToMin(rangeBend)-1;
		if(rangeBendMin<rangeBstartMin)
		    rangeBendMin=rangeBstartMin+24*60;
		    		
		if((rangeBstartMin>=rangeAstartMin) && (rangeBstartMin<=rangeAendMin)) return false;
		if((rangeBendMin>=rangeAstartMin) && (rangeBendMin<=rangeAendMin)) return false;
		
		if((rangeBstartMin < rangeAstartMin) && (rangeBendMin > rangeAendMin)) return false;
		if((rangeAstartMin < rangeBstartMin) && (rangeAendMin > rangeBendMin)) return false;
		
		return true;
}
	
function timeInterfierValidation(timeA, timeB){
		timeAmin = timeToMin(timeA);
		timeBmin = timeToMin(timeB);
		if(timeAmin == timeBmin) return false;
		
		return true;
}
	
function timeToMin(inTime){
		timeAry = inTime.split(":");
		var min = parseInt(timeAry[0]*60 + parseInt(timeAry[1]));
		return min;
}

function maxLengthValidateion(val, len){
	if(!basicFormateValidation(val)) return false;
	
	if(val.length <= len) return true;
	else return false;
}

function minLengthValidateion(val, len){
	if(!basicFormateValidation(val)) return false;
	
	if(val.length >= len) return true;
	else return false;
}

function maxNumberValidateion(val, number){
	if(parseInt(val, 10) <= parseInt(number, 10)) return true;
	else return false;
}

function minNumberValidateion(val, number){
	if(parseInt(val, 10) >= parseInt(number, 10)) return true;
	else return false;
}

function domainFormateValidateion(val){
	var tmp_val = val.split('.');
	if(tmp_val.length < 2) return false;
    return true;
/*	
	var rege = /^(([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.)(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){2}([1-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^(?:(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){6})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:::(?:(?:(?:[0-9a-fA-F]{1,4})):){5})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){4})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,1}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){3})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,2}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:(?:[0-9a-fA-F]{1,4})):){2})(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,3}(?:(?:[0-9a-fA-F]{1,4})))?::(?:(?:[0-9a-fA-F]{1,4})):)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,4}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9]))\.){3}(?:(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])))))))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,5}(?:(?:[0-9a-fA-F]{1,4})))?::)(?:(?:[0-9a-fA-F]{1,4})))|(?:(?:(?:(?:(?:(?:[0-9a-fA-F]{1,4})):){0,6}(?:(?:[0-9a-fA-F]{1,4})))?::))))$/;
	if(rege.test(val)) return true;
	else return false;
    */
}

function emailFormateValidateion(val){
	var tmp_val = val.split('@');
	if(tmp_val.length != 2) return false;
	
	var rege = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(rege.test(val)) return true;
	else return false;
}

function ip4ip6FormateValidation(val){
	var rege = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
	if(rege.test(val)) return true;
	else return false;
}

function basicFormateValidation(val){
	var rege = /['"\\<>]/;
	if(rege.test(val)){
		return false;
	}else{
		var testdata = val.toLowerCase();
		var rege1 = new RegExp('&lt');
		var rege2 = new RegExp('&gt');
		var rege3 = new RegExp('&#');
		if(rege1.test(testdata) || rege2.test(testdata) || rege3.test(testdata)){
			return false;
		}else{
			return true;
		}
	}
}

function chkInputTextValidation(obj){
	var ret_val = true;
	$(obj).each(function(){
		$(this).removeClass('input-message-error');
		
		if(ret_val){
			if($(this).hasClass('scm_not_chk')){ //no need check
				
			}else{
				var not_checked = true;
				//time format
				if($(this).hasClass('scm_time')){
					not_checked = false;
					
					if(!timeFormateValidateion($(this).val())) ret_val = false;
				}
				//phone format
				if($(this).hasClass('scm_phone')){
					not_checked = false;
					
					if(!phoneFormateValidateion($(this).val())) ret_val = false;
				}
				//ipv4
				if($(this).hasClass('scm_ip4')){
					not_checked = false;
					
					if(!ipv4FormateValidateion($(this).val())) ret_val = false;
				}
				//ipv4 and empty
				if($(this).hasClass('scm_ip4_and_empty')){
					not_checked = false;
					if($(this).val() !== ''){
						if(!ipv4FormateValidateion($(this).val())) ret_val = false;
					}
				}
				//mac segment
				if($(this).hasClass('scm_mac_segment')){
					not_checked = false;
					
					$(this).val($(this).val().toUpperCase());
					if(!macSegmentormateValidateion($(this).val())) ret_val = false;
				}
                //mac string 
				if($(this).hasClass('scm_mac_string')){
					not_checked = false;
					
					$(this).val($(this).val().toUpperCase());
					if(!macStringValidateion($(this).val())) ret_val = false;
				}
				//number
				if($(this).hasClass('scm_num')){
					not_checked = false;
					
					if(!numberFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//port 
				if($(this).hasClass('scm_port')){
					not_checked = false;
					
					if(!portFormateValidateion($(this).val())) ret_val = false;
				}
				
				//number not empty
				if($(this).hasClass('scm_num_not_empty')){
					not_checked = false;
					
					if(!numberNotEmptyFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//signed int
				if($(this).hasClass('scm_signed_int')){
					not_checked = false;
					
					if(!signedINTFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//unsigned int
				if($(this).hasClass('scm_unsigned_int')){
					not_checked = false;
					
					if(!unsignedINTFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//max length
				if($(this).hasClass('scm_max_length')){
					not_checked = false;
					
					if(!maxLengthValidateion($(this).val(), $(this).attr('scm_max_length'))) ret_val = false;
				}
				//min length
				if($(this).hasClass('scm_min_length')){
					not_checked = false;
					
					if(!minLengthValidateion($(this).val(), $(this).attr('scm_min_length'))) ret_val = false;
				}
				//max number
				if($(this).hasClass('scm_max_number')){
					not_checked = false;
					
					if(!maxNumberValidateion($(this).val(), $(this).attr('scm_max_number'))) ret_val = false;
				}
				//min number
				if($(this).hasClass('scm_min_number')){
					not_checked = false;
					
					if(!minNumberValidateion($(this).val(), $(this).attr('scm_min_number'))) ret_val = false;
				}
				//domain
				if($(this).hasClass('scm_domain')){
					not_checked = false;
					
					if(!domainFormateValidateion($(this).val())) ret_val = false;
				}
				//email
				if($(this).hasClass('scm_email')){
					not_checked = false;
					
					if(!emailFormateValidateion($(this).val())) ret_val = false;
				}
				//IPv4 IPv6
				if($(this).hasClass('scm_ip4ip6')){
                    if($(this).hasClass('scm_can_empty'))
                    {
                        if($(this).val() == "")
                            not_checked = true;
                        else
                            not_checked = false;
                    }
                    else
                        not_checked = false;
                    if(!not_checked)
                        if(!ip4ip6FormateValidation($(this).val())) ret_val = false;
				}
				//basic
				if($(this).hasClass('scm_basic_valid')){
					not_checked = false;
					
					if(!basicFormateValidation($(this).val())) ret_val = false;
				}
				//not empty
				if($(this).hasClass('scm_not_empty')){
					not_checked = false;
					
					if(!inputNotEmptyFormateValidateion($(this).val())) ret_val = false;
				}
				//scm_not_empty2
				if($(this).hasClass('scm_not_empty2')){
					not_checked = false;
					
					if(!inputNotEmptyFormate2Validateion($(this).val())) ret_val = false;
				}
                //scm_passwd_valid
				if($(this).hasClass('scm_passwd_valid')){
					not_checked = false;
					
					if(!passwordInvalidChk($(this).val())) ret_val = false;
				}
				if(not_checked){
					if(!inputFormateValidateion($(this).val())) ret_val = false;
				}
				
			}
			
			if(!ret_val){
				$(this).addClass('input-message-error');
			}
		}
	});
	
	return ret_val;
}

function chkInputTextValidation_wifi(obj){
	var ret_val = true;
	$(obj).each(function(){
		$(this).removeClass('input-message-error');
		
		if(ret_val){
			if($(this).hasClass('scm_not_chk')){ //no need check
				if(!basicFormateValidation($(this).val())) ret_val = false;
			}else{
				var not_checked = true;
				//time format
				if($(this).hasClass('scm_time')){
					not_checked = false;
					
					if(!timeFormateValidateion($(this).val())) ret_val = false;
				}
				//phone format
				if($(this).hasClass('scm_phone')){
					not_checked = false;
					
					if(!phoneFormateValidateion($(this).val())) ret_val = false;
				}
				//ipv4
				if($(this).hasClass('scm_ip4')){
					not_checked = false;
					
					if(!ipv4FormateValidateion($(this).val())) ret_val = false;
				}
				//ipv4 and empty
				if($(this).hasClass('scm_ip4_and_empty')){
					not_checked = false;
					if($(this).val() !== ''){
						if(!ipv4FormateValidateion($(this).val())) ret_val = false;
					}
				}
				//mac segment
				if($(this).hasClass('scm_mac_segment')){
					not_checked = false;
					
					$(this).val($(this).val().toUpperCase());
					if(!macSegmentormateValidateion($(this).val())) ret_val = false;
				}
                //mac string 
				if($(this).hasClass('scm_mac_string')){
					not_checked = false;
					
					$(this).val($(this).val().toUpperCase());
					if(!macStringValidateion($(this).val())) ret_val = false;
				}
				//number
				if($(this).hasClass('scm_num')){
					not_checked = false;
					
					if(!numberFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//port 
				if($(this).hasClass('scm_port')){
					not_checked = false;
					
					if(!portFormateValidateion($(this).val())) ret_val = false;
				}
				
				//number not empty
				if($(this).hasClass('scm_num_not_empty')){
					not_checked = false;
					
					if(!numberNotEmptyFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//signed int
				if($(this).hasClass('scm_signed_int')){
					not_checked = false;
					
					if(!signedINTFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//unsigned int
				if($(this).hasClass('scm_unsigned_int')){
					not_checked = false;
					
					if(!unsignedINTFormateValidateion($(this).val())){
						ret_val = false;
					}else{
						$(this).val(parseInt($(this).val(), 10));
					}
				}
				//max length
				if($(this).hasClass('scm_max_length')){
					not_checked = false;
					
					if(!maxLengthValidateion($(this).val(), $(this).attr('scm_max_length'))) ret_val = false;
				}
				//min length
				if($(this).hasClass('scm_min_length')){
					not_checked = false;
					
					if(!minLengthValidateion($(this).val(), $(this).attr('scm_min_length'))) ret_val = false;
				}
				//max number
				if($(this).hasClass('scm_max_number')){
					not_checked = false;
					
					if(!maxNumberValidateion($(this).val(), $(this).attr('scm_max_number'))) ret_val = false;
				}
				//min number
				if($(this).hasClass('scm_min_number')){
					not_checked = false;
					
					if(!minNumberValidateion($(this).val(), $(this).attr('scm_min_number'))) ret_val = false;
				}
				//domain
				if($(this).hasClass('scm_domain')){
					not_checked = false;
					
					if(!domainFormateValidateion($(this).val())) ret_val = false;
				}
				//email
				if($(this).hasClass('scm_email')){
					not_checked = false;
					
					if(!emailFormateValidateion($(this).val())) ret_val = false;
				}
				//IPv4 IPv6
				if($(this).hasClass('scm_ip4ip6')){
                    if($(this).hasClass('scm_can_empty'))
                    {
                        if($(this).val() == "")
                            not_checked = true;
                        else
                            not_checked = false;
                    }
                    else
                        not_checked = false;
                    if(!not_checked)
                        if(!ip4ip6FormateValidation($(this).val())) ret_val = false;
				}
				//basic
				if($(this).hasClass('scm_basic_valid')){
					not_checked = false;
					
					if(!basicFormateValidation($(this).val())) ret_val = false;
				}
				//not empty
				if($(this).hasClass('scm_not_empty')){
					not_checked = false;
					
					if(!inputNotEmptyFormateValidateion($(this).val())) ret_val = false;
				}
				//scm_not_empty2
				if($(this).hasClass('scm_not_empty2')){
					not_checked = false;
					
					if(!inputNotEmptyFormate2Validateion($(this).val())) ret_val = false;
				}
				//if(not_checked){
				//	if(!inputFormateValidateion($(this).val())) ret_val = false;
				//}
			}
			
			if(!ret_val){
				$(this).addClass('input-message-error');
			}
		}
	});
	
	return ret_val;
}
