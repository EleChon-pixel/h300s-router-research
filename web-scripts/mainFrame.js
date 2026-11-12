var sys_type = 'VD'; //1:(AD_SP)AD1018 spain, 2:(AD_INT)AD1018 internetional, 3:(FD)FD1018, 4:(VD)VD1018

function _obj_navigation_basic(){
	var navigation = [];
	
	return navigation;
}

function _obj_navigation_expert(){
	var navigation = [
		//phone
		{tab:'phone', id:'phone-numbers', hashid:'17', langid:'902011', control:[], submenu:[ //Phone Numbers
			{tab:'phone', id:'incoming', hashid:'18', langid:'902012', control:[], submenu:[]}, //Incoming
			{tab:'phone', id:'outgoing', hashid:'19', langid:'902013', control:[], submenu:[]}, //Outgoing
		]},
		//internet
		{tab:'internet', id:'firewall', hashid:'22', langid:'903001', control:[], submenu:[]}, //Firewall
		{tab:'internet', id:'port-mapping', hashid:'26', langid:'903005', control:[], submenu:[]}, //Port Mapping
		{tab:'internet', id:'exposed-host', hashid:'27', langid:'903006', control:[], submenu:[]}, //DMZ
		{tab:'internet', id:'parental-control', hashid:'23', langid:'903002', control:[], submenu:[]}, //Parental Control
		{tab:'internet', id:'dns-ddns', hashid:'29', langid:'SUB_NAVIGATION_ITEM_DNS_&_DDNS', control:[], submenu:[]}, //DNS & DDNS
		{tab:'internet', id:'upnp', hashid:'85', langid:'315001', control:[], submenu:[]}, //UPnP
		//wifi
		{tab:'wifi', id:'general', hashid:'35', langid:'904001', control:[], submenu:[]}, //General
		{tab:'wifi', id:'schedule', hashid:'36', langid:'SUB_NAVIGATION_ITEM_SCHEDULE', control:[], submenu:[]}, //Time Scheduler
		{tab:'wifi', id:'wps', hashid:'37', langid:'904003', control:[], submenu:[]}, //WPS
		{tab:'wifi', id:'mac-filter', hashid:'38', langid:'904004', control:[], submenu:[]}, //MAC Filter
		{tab:'wifi', id:'wifi-settings', hashid:'40', langid:'NAVIGATION_ITEM_SETTINGS', control:[], submenu:[]}, //Settings
		//settings
		{tab:'settings', id:'password', hashid:'60', langid:'905001', control:[], submenu:[]}, //Password
		{tab:'settings', id:'configuration', hashid:'54', langid:'905007', control:[], submenu:[]}, //Configuration
		{tab:'settings', id:'lan', hashid:'52', langid:'905009', control:[], submenu:[]}, //LAN
		{tab:'settings', id:'content-sharing', hashid:'56', langid:'505001', control:['sys_usb_status'], submenu:[ //Content Sharing
			{tab:'settings', id:'dlna', hashid:'57', langid:'905004', control:['sys_usb_status'], submenu:[]}, //DLNA
			{tab:'settings', id:'ftp', hashid:'50', langid:'905011', control:['sys_usb_status'], submenu:[]}, //FTP
			{tab:'settings', id:'network-share-samba', hashid:'51', langid:'SUB_SUB_NAVIGATION_ITEM_NETWORK_SHARE_SAMBA', control:['sys_usb_status'], submenu:[]} //Samba
		]},
		{tab:'settings', id:'printer-sharing', hashid:'83', langid:'521001', control:['sys_usb_status'], submenu:[]}, //Printer Sharing
		{tab:'settings', id:'usb', hashid:'58', langid:'905003', control:['sys_usb_status'], submenu:[]}, //USB
		{tab:'settings', id:'settings-access-control', hashid:'80', langid:'SUB_NAVIGATION_ITEM_ACCESS_CONTROL', control:[], submenu:[]}, //Access Control
		{tab:'settings', id:'xdsl', hashid:'90', langid:'903017', control:[], submenu:[]}, //xDSL		
		{tab:'settings', id:'wan', hashid:'92', langid:'903013', control:[], submenu:[]}, //WAN
		
		{tab:'settings', id:'ipv6-basic-configuration', hashid:'97', langid:'905023', control:['sys_ipv6_status'], submenu:[]}, //IPv6 Basic Configuration
		//status-and-support
		{tab:'status-and-support', id:'status', hashid:'1', langid:'906001', control:[], submenu:[ //Status
			{tab:'status-and-support', id:'voice_status', hashid:'3', langid:'906003', control:[], submenu:[]}, //Voice Status
			{tab:'status-and-support', id:'vdsl_status', hashid:'66', langid:'1300081', control:[], submenu:[]}, //VDSL Status
			{tab:'status-and-support', id:'wan_status', hashid:'67', langid:'906013', control:[], submenu:[]}, //WAN Status
			{tab:'status-and-support', id:'wi_fi_status', hashid:'wi_fi_status', langid:'SUB_SUB_NAVIGATION_ITEM_WIFI_STATUS', control:[], submenu:[]} //Wi-Fi Status
		]},
		{tab:'status-and-support', id:'event-log', hashid:'6', langid:'906006', control:[], submenu:[]}, //Event Log		
		{tab:'status-and-support', id:'restart', hashid:'41', langid:'906007', control:[], submenu:[]}, //Restart
		{tab:'status-and-support', id:'about', hashid:'42', langid:'906008', control:[], submenu:[]} //About
	];
	
	return navigation;
}

function chkPageSelect(page, dropDownBasExp,dsl_debug_enable,debug_fw){
	var reloadPage = false;
	var locationInfo = window.location.toString().split("#");
	var pageId = locationInfo[1];
	if(typeof(pageId) == 'undefined'){
		reloadPage = true;
	}
	
	if(page != "overview"){
		var navigation = [];
		if(dropDownBasExp == "basic"){
			navigation = _obj_navigation_basic();
		}else if(dropDownBasExp == "expert"){
			navigation = _obj_navigation_expert();
		}
		
		var ary_sub_page = _getMenuItemList(page, 'sub=', navigation);
		
		//open Phone Settings page
		if(page === 'phone'){
		
		ary_sub_page.push("sub=17&subSub=20");
	
		}
		//open Phone Settings page end
		
		if(!in_array(pageId, ary_sub_page)){
			pageId = ary_sub_page[0];
			reloadPage = true;
		}
		
		sys_pageid = pageId;
		if(reloadPage){
			window.parent.location = locationInfo[0]+"#"+pageId;
		}
	}else{
		sys_pageid = pageId;
	}
}

function header_init(page, dropDownBasExp){
	var html_out = "";
	html_out += '<div class="rel">';
	html_out += '<div id="top-bar">';
	html_out += '<div id="top-bar-content">';
	html_out += '<div class="rel">';
	html_out += '<a href="overview.html">';
	html_out += '<div id="logo">'+getHTMLString(1300068)+'</div>'; //VFH 500
	html_out += '</a>';
	html_out += '<div id="top-info" class="clearfix">';
	html_out += '<div id="top-info-mode" class="rel">';
	html_out += '<div id="logout" style="display: none;">&nbsp;</div>';
	html_out += '<select class="dropdown" style="width: 165px; display: none;">';
		//if(dropDownBasExp == "basic"){
		//	html_out += '<option value="basic" selected="selected">'+getHTMLString("GATEWAY_MODE_BASIC")+'</option>'; //Basic Mode
		//}else{
		//	html_out += '<option value="basic">'+getHTMLString("GATEWAY_MODE_BASIC")+'</option>'; //Basic Mode
		//}
		if(dropDownBasExp == "expert"){
			html_out += '<option value="expert" selected="selected">'+getHTMLString("GATEWAY_MODE_EXPERT")+'</option>'; //Expert Mode
		}else{
			html_out += '<option value="expert">'+getHTMLString("GATEWAY_MODE_EXPERT")+'</option>'; //Expert Mode
		}
	html_out += '<option value="logout">Logout</option>'; //Logout
	html_out += '</select>';
	html_out += '</div>';
	html_out += '<div id="top-info-logged-user">';
	html_out += '<div class="page-loader-container load-once">'+getHTMLString('PAGE_TOP_INFO_USER_LOGGED_IN').replace('%s', '<strong>'+sys_logged_in_users+'</strong>')+'</div>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '<div id="rhombus-navigation" class="clearfix">';
	html_out += '<div class="rel">';
	html_out += '<div id="navigation">';
	html_out += '<ul class="clearfix">';
	html_out += '<li style="min-width: 110px;"><a href="overview.html"><span name="NAVIGATION_ITEM_OVERVIEW">'+getHTMLString("NAVIGATION_ITEM_OVERVIEW")+'</span></a></li>'; //Overview
	if(sys_phone_service){
	    html_out += '<li><a href="phone.html#sub=17" onclick="page_data_load(\'phone\');"><span id="lang700032">'+getHTMLString(700032)+'</span></a></li>'; //Phone
	}
	html_out += '<li><a href="internet.html#sub=22" onclick="page_data_load(\'internet\');"><span id="lang700033">'+getHTMLString(700033)+'</span></a></li>'; //Internet
	html_out += '<li><a href="wifi.html#sub=35" onclick="page_data_load(\'wifi\');"><span id="lang700034">'+getHTMLString(700034)+'</span></a></li>'; //Wi-Fi
	//html_out += '<li><a href="sharing.html#sub=sharing" onclick="page_data_load(\'sharing\');"><span name="PAGE_SHARING_TITLE">'+getHTMLString('PAGE_SHARING_TITLE')+'</span></a></li>'; //Sharing
	html_out += '<li><a href="settings.html#sub=60" onclick="page_data_load(\'settings\');"><span id="lang700035">'+getHTMLString(700035)+'</span></a></li>'; //Settings
	html_out += '<li><a href="status-and-support.html#sub=1" onclick="page_data_load(\'status-and-support\');"><span id="lang700036">'+getHTMLString(700036)+'</span></a></li>'; //Status &amp; Support
	html_out += '</ul>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';
	$("#header").html(html_out);
}

function navigation_init(page, dropDownBasExp,dsl_debug_enable,debug_fw){
	var navigation = [];
	if(dropDownBasExp == "basic"){
		navigation = _obj_navigation_basic();
	}else if(dropDownBasExp == "expert"){
		navigation = _obj_navigation_expert();
	}
	
	return _makeNavigation(navigation);
}

function _makeNavigation(obj){
	var html = '';
	//overview
	html += '<div class="subnavigation-1of6">';
	html += '<ul class="sub-navigation">';
	html += '<li class="sub-navigation-item navigation-item">';
	html += '<a class="sub-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_OVERVIEW")+'</a>'; //Overview
	html += '</li>';
	html += '</ul>';
	html += '</div>';
	
	//phone
	html += '<div class="subnavigation-2of6">';
	html += _makeMenuItem('phone', obj);
	html += '</div>';
	
	//internet
	html += '<div class="subnavigation-3of6">';
	html += _makeMenuItem('internet', obj);
	html += '</div>';
	
	//wifi
	html += '<div class="subnavigation-4of6">';
	html += _makeMenuItem('wifi', obj);
	html += '</div>';
	
	//Sharing
	//html += '<div class="subnavigation-5of7">';
	//html += _makeMenuItem('sharing', obj);
	//html += '</div>';
	
	//settings
	html += '<div class="subnavigation-5of6">';
	html += _makeMenuItem('settings', obj);
	html += '</div>';
	
	//status-and-support
	html += '<div class="subnavigation-6of6">';
	html += _makeMenuItem('status-and-support', obj);
	html += '</div>';
	
	return html;
}

function _makeMenuItem(page, obj){
	var html = '';
	html += '<ul class="sub-navigation">';
	for(var key in obj){
		if(obj[key].tab === page && _chkNavigationControl(obj[key].control)){
			if(obj[key].submenu.length > 0){
				html += '<li id="'+obj[key].hashid+'" class="sub-navigation-item navigation-item subnavigation-has-sub-sub">';
			}else{
				html += '<li id="'+obj[key].hashid+'" class="sub-navigation-item navigation-item">';
			}
			html += '<a href="#sub='+obj[key].hashid+'" onclick="page_data_load(\''+obj[key].tab+'\');" class="sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			if(obj[key].submenu.length > 0){
				html += _makeSubMenuItem(page, obj[key].hashid, obj[key].submenu);
			}
			html += '</li>';
		}
	}
	html += '</ul>';
	
	return html;
}

function _makeSubMenuItem(page, hashid, obj){
	var html = '';
	html += '<ul class="sub-sub-navigation">';
	for(var key in obj){
		if(obj[key].tab === page && _chkNavigationControl(obj[key].control)){
			html += '<li id="'+obj[key].hashid+'" class="sub-sub-navigation-item navigation-item">';
			html += '<a href="#sub='+hashid+'&subSub='+obj[key].hashid+'" onclick="page_data_load(\''+obj[key].tab+'\');" class="sub-sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			html += '</li>';
		}
	}
	html += '</ul>';
	
	return html;
}

function _chkNavigationControl(control){
	var ret_val = true;
	for(var key in control){
		switch (control[key]){
			case 'sys_umts_status':
				if(sys_umts_status === false){
					ret_val = false;
				}
				break;
			case 'sys_usb_status':
				if(sys_usb_status === false){
					ret_val = false;
				}
				break;
			case 'sys_ipv6_status':
				if(sys_ipv6_status === false){
					ret_val = false;
				}
				break;
			case 'sys_fon_status':
				if(sys_fon_status === false){
					ret_val = false;
				}
				break;
			case 'sys_iptv_status':
				if(sys_iptv_status === false){
					ret_val = false;
				}
				break;
			case 'sys_band_steering':
				if(sys_band_steering === false){
					ret_val = false;
				}
				break;
			case 'sys_sfp_status':
				if(sys_sfp_status === false){
					ret_val = false;
				}
				break;
			case 'sys_vodafone_safe_netwok':
				if(sys_vodafone_safe_netwok === false){
					ret_val = false;
				}
				break;
		}
	}
	
	return ret_val;
}

function _getMenuItemList(page, prestr, obj){
	var ret_ary = [];
	for(var key in obj){
		if(obj[key].tab === page && _chkNavigationControl(obj[key].control)){
			ret_ary.push(prestr+obj[key].hashid);
			
			if(obj[key].submenu.length > 0){
				ret_ary = ret_ary.concat(_getMenuItemList(page, prestr+obj[key].hashid+'&subSub=', obj[key].submenu));
			}
		}
	}
	
	return ret_ary;
}

function mobile_header_init(page, dropDownBasExp,dsl_debug_enable,debug_fw){
	var html_out = '';
	html_out += '<div class="rel">';
	html_out += '<div class="mobile-header-style">';
	html_out += '<div class="hamburger-menu">';
	html_out += '<span></span>';
	html_out += '<span></span>';
	html_out += '<span></span>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '<div class="product-name">';
	html_out += '<h3>'+getHTMLString(1300068)+'</h3>';
	html_out += '</div>';
	html_out += '<div class="menu">';
	html_out += '<ul class="clearfix mobile-navigation">';
	//mobile-navigation
	var navigation = [];
	if(dropDownBasExp == "basic"){
		navigation = _obj_navigation_basic();
	}else if(dropDownBasExp == "expert"){
		navigation = _obj_navigation_expert();
	}
	html_out += _makeMobileNavigation(navigation, page);
	//mobile-navigation end
	html_out += '</ul>';
	html_out += '</div>';
	html_out += '<div class="mobile-menu-bottom">';
	html_out += '<div class="bottom-info">';
	html_out += '<div class="page-loader-container load-once">'+getHTMLString("PAGE_TOP_INFO_USER_LOGGED_IN").replace('%s', '<strong>'+sys_logged_in_users+'</strong>')+'</div>';
	html_out += '</div>';
	html_out += '<div class="mode-menu">';
	html_out += '<select class="dropdown" style="width: 165px;">';
		//if(dropDownBasExp == "basic"){
		//	html_out += '<option value="basic" selected="selected">'+getHTMLString("GATEWAY_MODE_BASIC")+'</option>'; //Basic Mode
		//}else{
		//	html_out += '<option value="basic">'+getHTMLString("GATEWAY_MODE_BASIC")+'</option>'; //Basic Mode
		//}
		if(dropDownBasExp == "expert"){
			html_out += '<option value="expert" selected="selected">'+getHTMLString("GATEWAY_MODE_EXPERT")+'</option>'; //Expert Mode
		}else{
			html_out += '<option value="expert">'+getHTMLString("GATEWAY_MODE_EXPERT")+'</option>'; //Expert Mode
		}
	html_out += '</select>';
	html_out += '</div>';
	html_out += '<div class="logout">';
	html_out += '<a class="mobile_logout">Logout</a>';
	html_out += '</div>';
	html_out += '</div>';
	html_out += '</div>';

	$("#mobile-menu-overlay").html(html_out);
}

function _makeMobileNavigation(obj, page){
	var html = '';
	//overview
	if(page === "overview"){
		html += '<li class="main-item mobile-navigation-item-1 first-item active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-1 first-item">';
	}
	html += '<a href="overview.html" class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_OVERVIEW")+'</a>'; //Overview
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';			
	html += '</div>';
	//html += '<ul class="mobile-sub-navigation">';
	//html += '<li class="mobile-sub-navigation-item mobile-navigation-item">';
	//html += '<a class="mobile-sub-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_OVERVIEW")+'</a>'; //Overview
	//html += '</li>';
	//html += '</ul>';
	html += '</li>';
	//phone
	if(page === "phone"){
		html += '<li class="main-item mobile-navigation-item-2 active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-2">';
	}
	html += '<a class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_PHONE")+'</a>'; //Phone
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';
	html += '</div>';
	html += _makeMobileMenuItem(page, 'phone', obj);
	html += '</li>';
	
	//internet
	if(page === "internet"){
		html += '<li class="main-item mobile-navigation-item-3 active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-3">';
	}
	html += '<a class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_INTERNET")+'</a>'; //Internet
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';
	html += '</div>';
	html += _makeMobileMenuItem(page, 'internet', obj);
	html += '</li>';
	
	//wifi
	if(page === "wifi"){
		html += '<li class="main-item mobile-navigation-item-4 active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-4">';
	}
	html += '<a class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_WIFI")+'</a>'; //WiFi
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';
	html += '</div>';
	html += _makeMobileMenuItem(page, 'wifi', obj);
	html += '</li>';
	
	//Sharing
	//if(page === "sharing"){
	//	html += '<li class="main-item mobile-navigation-item-5 active">';
	//}else{
	//	html += '<li class="main-item mobile-navigation-item-5">';
	//}
	//html += '<a class="mobile-navigation-item-title">'+getHTMLString('NAVIGATION_ITEM_SHARING')+'</a>'; //Sharing
	//html += '<div class="expand-mobile-sub">';
	//html += '<span></span>';
	//html += '<span></span>';
	//html += '</div>';
	//html += _makeMobileMenuItem(page, 'sharing', obj);
	//html += '</li>';
	
	//settings
	if(page === "settings"){
		html += '<li class="main-item mobile-navigation-item-5 active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-5">';
	}
	html += '<a class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_SETTINGS")+'</a>'; //Settings
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';
	html += '</div>';
	html += _makeMobileMenuItem(page, 'settings', obj);
	html += '</li>';
	
	//status-and-support
	if(page === "status-and-support"){
		html += '<li class="main-item mobile-navigation-item-6 active">';
	}else{
		html += '<li class="main-item mobile-navigation-item-6">';
	}
	html += '<a class="mobile-navigation-item-title">'+getHTMLString("NAVIGATION_ITEM_STATUS_AND_SUPPORT")+'</a>'; //Status & Support
	html += '<div class="expand-mobile-sub">';
	html += '<span></span>';
	html += '<span></span>';
	html += '</div>';
	html += _makeMobileMenuItem(page, 'status-and-support', obj);
	html += '</li>';
	
	return html;
}

function _makeMobileMenuItem(page, get_page, obj){
	var html = '';
	html += '<ul class="mobile-sub-navigation">';
	for(var key in obj){
		if(obj[key].tab === get_page && _chkNavigationControl(obj[key].control)){
			if(obj[key].submenu.length > 0){
				html += '<li id="mobile_'+obj[key].hashid+'" class="mobile-sub-navigation-item mobile-navigation-item subnavigation-has-sub-sub">';
			}else{
				html += '<li id="mobile_'+obj[key].hashid+'" class="mobile-sub-navigation-item mobile-navigation-item">';
			}
			
			if(page === get_page){
				html += '<a href="#sub='+obj[key].hashid+'" onclick="page_data_load(\''+obj[key].tab+'\');" class="mobile-sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			}else{
				html += '<a href="'+get_page+'.html#sub='+obj[key].hashid+'" class="mobile-sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			}
			
			if(obj[key].submenu.length > 0){
				html += _makeMobileSubMenuItem(page, get_page, obj[key].hashid, obj[key].submenu);
			}
			
			html += '</li>';
		}
	}
	html += '</ul>';
	
	return html;
}

function _makeMobileSubMenuItem(page, get_page, hashid, obj){
	var html = '';
	html += '<ul class="mobile-sub-sub-navigation">';
	for(var key in obj){
		if(obj[key].tab === get_page && _chkNavigationControl(obj[key].control)){
			html += '<li id="mobile_'+obj[key].hashid+'" class="mobile-sub-sub-navigation-item mobile-navigation-item">';
			
			if(page === get_page){
				html += '<a href="#sub='+hashid+'&subSub='+obj[key].hashid+'" onclick="page_data_load(\''+obj[key].tab+'\');" class="mobile-sub-sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			}else{
				html += '<a href="'+get_page+'.html#sub='+hashid+'&subSub='+obj[key].hashid+'" class="mobile-sub-sub-navigation-item-title">'+getHTMLString(obj[key].langid)+'</a>';
			}
			
			html += '</li>';
		}
	}
	html += '</ul>';
	
	return html;
}
