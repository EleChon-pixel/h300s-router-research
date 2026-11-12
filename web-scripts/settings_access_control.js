$(document).ready(function(){
	var html = '';
	html += '<option value="allow">'+getHTMLString(517008)+'</option>'; //Allow
	html += '<option value="deny">'+getHTMLString(517009)+'</option>'; //Deny
	$('select', '#content').html(html);

	$('.h3-content.access-control-services tr').each(function(){
		$(this).find('td').each(function(key, val){
			if(key === 2){
				$(this).find('select').append('<option value="trusted">'+getHTMLString(517010)+'</option>'); //Trusted Only
			}
		});
	});
	
	page_settings_access_control_load();
	transHTMLString();
});

function page_settings_access_control_load(){

			$.ajax({  
			type : 'get',
			dataType: "json",
			url : './data/user_data.json?_=' + new Date().getTime() + '&csrf_token=' + csrf_token,
			async : false,
			success : function(data){
				//Invalid filter
				data = filterInvalidString(data);
				
				usermode = getUserData('usermode', data);
				sys_country = getUserData('country', data);

				var icmp = document.getElementById("icmp_status");
				var tr069 = document.getElementById("tr069_status");

				if (sys_country == "TR") {
                                    icmp.style.display = 'none';
                                    tr069.style.display = 'none';
				} else if (sys_country == "GR") {
				}
			}
			});

	var JSONSource   = './data/settings_access_control.json?_=' + new Date().getTime() + '&csrf_token=' + csrf_token;
	$.getJSON(JSONSource, function(data) {
		//Invalid filter
		data = filterInvalidString(data);
		
		$.each(data, function(e_key, e_value){
			$.each(e_value, function(key, val){
				if(key == "icmp_status"){
					var tmp_find = (val==='1')?'.status-service-on':'.status-service-off';
					$('#'+key).find(tmp_find).show();
				} 
				if(key == "icmp_wan") $('#icmp_wan').val(val).trigger("chosen:updated");
				if(key == "icmp_lan") $('#icmp_lan').val(val).trigger("chosen:updated");
				if(key == "snmp_status"){
					var tmp_find = (val==='1')?'.status-service-on':'.status-service-off';
					$('#'+key).find(tmp_find).show();
				} 
				if(key == "snmp_wan") $('#snmp_wan').val(val).trigger("chosen:updated");
				if(key == "snmp_lan") $('#snmp_lan').val(val).trigger("chosen:updated");
				if(key == "ssh_status"){
					var tmp_find = (val==='1')?'.status-service-on':'.status-service-off';
					$('#'+key).find(tmp_find).show();
				} 
				if(key == "ssh_lan") $('#ssh_lan').val(val).trigger("chosen:updated");
				if(key == "http_status"){
					var tmp_find = (val==='1')?'.status-service-on':'.status-service-off';
					$('#'+key).find(tmp_find).show();
				} 
				if(key == "http_lan") $('#http_lan').val(val).trigger("chosen:updated");
				if(key == "tr069_status"){
					var tmp_find = (val==='1')?'.status-service-on':'.status-service-off';
					$('#'+key).find(tmp_find).show();
				} 
				if(key == "tr069_wan") $('#tr069_wan').val(val).trigger("chosen:updated");
				if(key == "tr069_lan") $('#tr069_lan').val(val).trigger("chosen:updated");
			});
			
			addChosen2Select('#content');
		});
		
		page_settings_trusted_network_load();
	});
}

function page_settings_trusted_network_load(){
	$('.h3-content.trusted-networks .in_data').remove();
	
	var JSONSource   = './data/settings_trusted_network.json?_=' + new Date().getTime() + '&csrf_token=' + csrf_token;
	$.getJSON(JSONSource, function(data) {
		//Invalid filter
		data = filterInvalidString(data);
		
		$.each(data, function(e_key, e_value){
			var range_start;
			var range_end;
			
			$.each(e_value, function(key, val){
				if(key == 'range_start') range_start = val;
				if(key == 'range_end') range_end = val;
			});
			
			if(range_start != undefined && range_end != undefined){
				ary_range_start = range_start.split('.');
				ary_range_end = range_end.split('.');
				
				var html = '';
				html += '<tr class="in_data">';
				html += '<td><div class="mobile">'+getHTMLString(517013)+'<br></div>';
				html += '<input class="max3" type="text" value="'+ary_range_start[0]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_start[1]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_start[2]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_start[3]+'" disabled/>';
				html += '</td>';
				html += '<td><div class="mobile">'+getHTMLString(517014)+'<br></div>';
				html += '<input class="max3" type="text" value="'+ary_range_end[0]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_end[1]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_end[2]+'" disabled/>.';
				html += '<input class="max3" type="text" value="'+ary_range_end[3]+'" disabled/>';
				html += '</td>';
				html += '<td style="display: none;">';
				html += '&nbsp;';
				//html += '<input class="button button-delete" value="" type="button">';
				html += '</td>';
				html += '</tr>';
				
				$('.h3-content.trusted-networks tbody').append(html);
			}
			
		});
		
		if($('.h3-content.trusted-networks .in_data').length == 0){
			$('.h3-content.trusted-networks .no-items-info').show();
		}else{
			$('.h3-content.trusted-networks .no-items-info').hide();
		}
	});
}

$(function () {
	//select
	$('select', '#content').bind('change', function(){
		if(logMessage && window.console) console.log("select change");
		
		$('.message-arrowbox').show();
		$('.message-arrowbox-applied').hide();
	});
	
	//#cancelButton
	$('#cancelButton').bind("click",function(){
		if(logMessage && window.console) console.log('#cancelButton click');
		
		loginUserChkLoginTimeout.set(sys_username, loginUserChkLoginTimeoutRet, 'login');
		
		$('.scm_error_msg').remove();
		$('.popup.big input').removeClass('input-message-error');
		
		//reload
		page_settings_access_control_load();
		
		$('.message-arrowbox').hide();
		$('.message-arrowbox-applied').hide();
	});
	
	//#applyButton
	$('#applyButton').bind("click",function(){
		if(logMessage && window.console) console.log('#applyButton click');
		
		if($('[name="PAGE_FIREWALL_WARNING_APPLY_OR_CANCEL"]').closest('.message-arrowbox').css('display') != 'block') return; //no any change
		
		//disabled button
		$('#cancelButton').attr('disabled', 'disabled');
		$('#applyButton').attr('disabled', 'disabled');
		/*
		if($('#trustedNetwork').hasClass('button-off')){
			$('input[type="text"]').addClass('scm_not_chk');
		}else{
			$('input[type="text"]').removeClass('scm_not_chk');
		}
		
		//Check Validation
		$('.scm_error_msg').remove();
		$('.popup.big input').removeClass('input-message-error');
		
		if(!chkInputTextValidation('input[type="text"]')){
			page_settings_access_InvalidMessageShow('input[type="text"]');
			$('.message-arrowbox').hide();
			
			//enabled button
			$('#cancelButton').removeAttr('disabled');
			$('#applyButton').removeAttr('disabled');
			
			return;
		}
		//Check Validation End
		*/
		var trusted_network_list = '[';
		var have_data = false;
		$('.h3-content.trusted-networks .in_data').each(function(){
			have_data = true;
			var range_start = '';
			var range_end = '';
			$(this).find('td:nth-of-type(1) input').each(function(){
				if(range_start !== ''){
					range_start += '.';
				}
				range_start += $(this).val();
			});
			$(this).find('td:nth-of-type(2) input').each(function(){
				if(range_end !== ''){
					range_end += '.';
				}
				range_end += $(this).val();
			});
			
			trusted_network_list += '{';
			trusted_network_list += '"range_start" : "'+range_start+'",';
			trusted_network_list += '"range_end" : "'+range_end+'"';
			trusted_network_list += '},';
		});
		if(have_data) trusted_network_list = trusted_network_list.slice(0, -1);
		trusted_network_list += ']';
		
		var data_format = [
			{nameObj : settingsAccessControlICMPWanSelect, value : $('#icmp_wan').val()},
			{nameObj : settingsAccessControlICMPLanSelect, value : $('#icmp_lan').val()},
			//{nameObj : settingsAccessControlSNMPWanSelect, value : $('#snmp_wan').val()},
			//{nameObj : settingsAccessControlSNMPLanSelect, value : $('#snmp_lan').val()},
			{nameObj : settingsAccessControlSSHLanSelect, value : $('#ssh_lan').val()},
			{nameObj : settingsAccessControlHTTPLanSelect, value : $('#http_lan').val()},
			{nameObj : settingsAccessControlTR069WanSelect, value : $('#tr069_wan').val()},
			{nameObj : settingsAccessControlTR069LanSelect, value : $('#tr069_lan').val()},
			{nameObj : settingsTrustedNetworkList, value : trusted_network_list}
		];
		dataBatchSend(data_format, setAccessControlRet, "settings_access_control");
		
		function setAccessControlRet(data, textStatus, jqXHR){
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
	
	global_func_load('#content');
});

function page_settings_access_InvalidMessageShow(obj){
	var msg_unshow = true;
	$(obj).each(function(key, val){
		if(msg_unshow){
			if($(this).hasClass('input-message-error')){
				msg_unshow = false;
				var element_name = '';
				var tmp_obj = $(this).closest('.table-col');
				if(tmp_obj.hasClass('table-col1')) element_name = getHTMLString(517013);
				if(tmp_obj.hasClass('table-col2')) element_name = getHTMLString(517014);
				
				element_name = '"'+element_name+'"';
				
				var msg = getHTMLString(700078);
				msg = msg.replace('%s1', element_name);
				msg = msg.replace('% S1', element_name);
				var html = '<div class="scm_error_msg message message-error">'+msg+'</div>';
				
				$('.apply-cancel-margin-top').before(html);
			}
		}
	});
}
