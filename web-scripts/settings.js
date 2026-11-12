
function page_settings_load(){
	$('#content').hide();
	
	page_settings_die();
	
	var pageId = sys_pageid;
  var data = new Date().getTime() + '&csrf_token=' + csrf_token;

	if(pageId == "sub=60"){ //password
			$('#content').load('settings_page/settings_password.html?_=' + data, function(response, status, xhr) {
				$(this).addClass('content-password');
				
				var tmp_js_ary = ["js/settings_password.js"];
				getScriptByArray(tmp_js_ary);
				//alert(response);
				//alert(status);
				//alert(xhr);
			});
	}else if(pageId == "sub=54"){ //configuration
		if(usermode == 'basic'){
			$('#content').load('settings_page/settings_configuration_enduser.html?_=' + data, function(response, status, xhr) {
				$(this).addClass('content-configuration');
				
				var tmp_js_ary = ["js/settings_configuration_enduser.js", "js/settings_configuration.js"];
				getScriptByArray(tmp_js_ary);
			});
		}else{
			$('#content').load('settings_page/settings_configuration.html?_=' + data, function(response, status, xhr) {
				$(this).addClass('content-configuration');
				var tmp_js_ary = ["js/settings_configuration_enduser.js", "js/settings_configuration.js"];
				getScriptByArray(tmp_js_ary);
			});
		}

	}else if(pageId == "sub=52"){ //LAN
		$('#content').load('settings_page/settings_lan.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-ipv4');
			
			var tmp_js_ary = ["js/settings_lan.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});

	}else if(pageId == "sub=75"){ //tr069
		$('#content').load('settings_page/settings_tr069.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-tr-069');
			
			var tmp_js_ary = ["js/settings_tr069.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
	}else if(pageId == "sub=74"){ //internet time
		$('#content').load('settings_page/settings_internet_time.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-internet-time');
			
			var tmp_js_ary = ["js/settings_internet_time.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=59"){ //Firmware Update
		$('#content').load('settings_page/settings_fw_update.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-firmware-update');
			
			var tmp_js_ary = ["js/settings_fw_update.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=80"){ //Access Control Services
		$('#content').load('settings_page/settings_access_control.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-access-control');
			
			var tmp_js_ary = ["js/settings_access_control.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=69"){ //ADSL Settings
		$('#content').load('settings_page/settings_adsl_settings.html?_=' + data, function(response, status, xhr) {
			//$(this).addClass('content-adsl');
			
			var tmp_js_ary = ["js/settings_adsl_settings.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=88"){ //UMTS
		$('#content').load('settings_page/settings_umts.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-mobile-settings');
			
			var tmp_js_ary = ["js/settings_umts.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	//INTERNATIONAL PAGES START
	}else if(pageId == "sub=58"){ //USB
		$('#content').load('settings_page/settings_usb.html?_=' + data, function(response, status, xhr) {
			//$(this).addClass('content-usb');
			
			var tmp_js_ary = ["js/settings_usb.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=56"){ //Content Sharing
		$('#content').load('settings_page/settings_content_sharing.html?_=' + data, function(response, status, xhr) {
			//$(this).addClass('content-content-sharing');
			
			var tmp_js_ary = ["js/settings_content_sharing.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=56&subSub=57"){ //DLNA
		$('#content').load('settings_page/settings_dlna.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('scm_content');
			$(this).addClass('content-dlna');
			
			var tmp_js_ary = ["js/settings_content_sharing_folder.js","js/settings_dlna.js" ];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=56&subSub=51"){ //Network Share (Samba)
		$('#content').load('settings_page/settings_network_sharing.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('scm_content');
			$(this).addClass('content-network-share-samba');
			
			var tmp_js_ary = ["js/settings_content_sharing_folder.js", "js/settings_network_sharing.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=56&subSub=50"){ //FTP
		$('#content').load('settings_page/settings_ftp.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('scm_content');
			$(this).addClass('content-ftp');
			
			var tmp_js_ary = ["js/settings_content_sharing_folder.js", "js/settings_ftp.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=83"){ //Printer Sharing
		$('#content').load('settings_page/settings_printer_sharing.html?_=' + data, function(response, status, xhr) {
			//$(this).addClass('content-printer-sharing');
			
			var tmp_js_ary = ["js/settings_printer_sharing.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=73"){ //Quality of Service(QoS)
		$('#content').load('settings_page/settings_qos.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-qos');
			
			var tmp_js_ary = ["js/settings_qos.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=76"){ //SNMP Configuration
		$('#content').load('settings_page/settings_snmp.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-snmp');
			
			var tmp_js_ary = ["js/settings_snmp.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
	//INTERNATIONAL PAGES END
		
	}else if(pageId == "sub=97"){ //IPv6 Basic Configuration
		$('#content').load('settings_page/settings_ipv6_basic_configuration.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-ipv6-basic-configuration');
			
			var tmp_js_ary = ["js/settings_ipv6_basic_configuration.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=108"){ //TV Settings
		$('#content').load('settings_page/settings_tv_settings.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-tv-settings');
			
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=55"){ //Energy Settings
		$('#content').load('settings_page/settings_energy_settings.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-energy-settings');
			
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
	}
else if(pageId == "sub=89"){ //UMTS
		$('#content').load('internet_page/internet_umts.html?_='+data, function(response, status, xhr) {
			$(this).addClass('content-mobile');
			
			var tmp_js_ary = ['js/internet_umts.js'];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=68"){ //WAN
		$('#content').load('settings_page/settings_wan2.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-wan');
			
			var tmp_js_ary = ["js/settings_wan2.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=92"){ //FD1018/VD1018 WAN
		$('#content').load('settings_page/settings_wan2.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-wan');
			
			var tmp_js_ary = ["js/settings_wan2.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=86"){ //Static Routing
		$('#content').load('settings_page/settings_static_routing.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-static-routing');
			
			var tmp_js_ary = ["js/settings_static_routing.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=90"){ //xDSL
		$('#content').load('settings_page/settings_xdsl_settings.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-xdsl');
			
			var tmp_js_ary = ["js/settings_xdsl_settings.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}else if(pageId == "sub=93"){ //Policy Routing
		$('#content').load('settings_page/settings_policy_routing.html?_=' + data, function(response, status, xhr) {
			$(this).addClass('content-policy-routing');
			
			var tmp_js_ary = ["js/settings_policy_routing.js"];
			getScriptByArray(tmp_js_ary);
			//alert(response);
			//alert(status);
			//alert(xhr);
		});
		
	}	
	else{
		$('#content').html('&nbsp;');
	}
}

function page_settings_die(){
}
