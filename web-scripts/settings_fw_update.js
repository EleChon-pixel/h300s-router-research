$(document).ready(function(){
	page_data_load("settings_fw_update");
	transHTMLString();
});

function page_settings_fw_update_load(data){
	var update_status;
	var update_msg;
	var fw_version;
	//var usb_status;
	//var usb_fw_file;
	
	$.each(data, function(e_key, e_value){
		$.each(e_value, function(key, val){
			if(key == 'update_status') update_status = val;
			if(key == 'update_msg') update_msg = val;
			if(key == 'fw_version') fw_version = val;
			//if(key == 'usb_status') usb_status = val;
			//if(key == 'usb_fw_file') usb_fw_file = val;
			
		});
	});
	
	$('#fw_version').html(fw_version);
	
	$('#uploadedfile_form').html(page_settings_fw_updload_form_HtmlStr());
	$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
	//$('#uploadedfile_form').width($('#select_upload_file').outerWidth(true));
	$('.window_resize').on('window_resize', function(){
		$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
	});
	
	page_settings_fw_updload_form_Func_Load();
	/*
	if(usb_status == '1'){
		$('#installUpdate2').removeAttr('disabled').removeAttr('style');
		$('#usb_fw_file').html(usb_fw_file);
	}
	*/
	if(update_status == '1'){
		if(update_msg != '0'){ //fail
			$('.popup').html(page_settings_fw_update_failed_HtmlStr(update_msg));
			
			$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
			$('.popup, .blackBackground').fadeIn();
			
			$('.popup .button-apply').bind('click', function () {
				if(false && window.console) console.log(".popup .button-apply click");
				
				$('.popup, .blackBackground').fadeOut();
			});
		}
		if(update_msg == '0'){ //successfully
			function settingsFWupdateSuccessfullyReload(){
				$('#logout').trigger('click');
				window.parent.location = 'index.htm';
			}
			
			$('.popup').html(page_settings_fw_update_successfully_HtmlStr());
			
			$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
			$('.popup, .blackBackground').fadeIn();
			
			setTimeout(settingsFWupdateSuccessfullyReload, 120000); // 120 sec
		}
	}
}

function page_settings_fw_update_confirm_HtmlStr(){
	var html = '';
	html += '<div class="mobile-cancel-popup button-cancel"></div>';
	html += '<div class="row tL"><span id="lang502045">'+getHTMLString(502045)+'</span></div>';
	html += '<div class="clearfix apply-cancel">';
	html += '<input id="applyButton" class="button button-apply" value="'+getHTMLString(700001)+'" type="button">';
	html += ' ';
	html += '<input id="cancelButton" class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
	html += '</div>';
	
	return html;
}

function page_settings_fw_update_progress_HtmlStr(){
	var html = '';
	html += '<p class="title tL"><span id="lang502018">'+getHTMLString(502018)+'</span></p>';
	html += '<div class="row tL">';
	html += '<div class="full">';
	html += '<span id="lang502019">'+getHTMLString(502019)+'</span></div>';
	html += '</div>';
	html += '<div class="tC">';
	html += '<div id="progress-bar-box" style="margin: 0 auto;">';
	html += '<div id="progress-bar-image"></div>';
	html += '</div>';
	html += '</div>';
		
	return html;
}
function get_failed_lang_code_by_update_msg(update_msg)
{
    if(update_msg == "-2")
        return 1301101; //502048
    else if(update_msg == "-3")
        return 502047;
    else if(update_msg == "-4")
        return 502050;
    else if(update_msg == "-5")
        return 502049;
    else
        return 502047;

}

function page_settings_fw_update_failed_HtmlStr(update_msg){
    var failed_lang_code = 1301101; //502048
    failed_lang_code = get_failed_lang_code_by_update_msg(update_msg);
	var html = '';
	html += '<p class="title tL"><span id="lang502047">'+getHTMLString(502047)+'</span></p>';
	html += '<div class="row tL">';
	html += '<div class="full">';
	html += '<span id="lang502048">'+getHTMLString(failed_lang_code)+'</span></div>';
	html += '</div>';
	html += '<div class="clearfix apply-cancel">';
	html += '<input class="button button-apply" value="OK" type="submit">';
	html += '</div>';
	
	return html;
}

function page_settings_fw_update_successfully_HtmlStr(){
	var html = '';
	html += '<p class="title tL"><span id="lang502020">'+getHTMLString(502020)+'</span></p>';
	html += '<div class="row tL big">';
	html += '<div class="full">';
	html += '<span id="lang502021">'+getHTMLString(502021)+'</span></div>';
	html += '</div>';
	html += '<div class="apply-cancel tC" style="border-top: medium none;">';
	html += '<img alt="" src="img/icon-thinking.gif" />';
	html += '</div>';
	
	return html;
}

function page_settings_fw_updload_form_HtmlStr(){
	var html = '';
	html += '<form enctype="multipart/form-data" action="/data/settings_fw_update.json" method="POST">';
	html += '<input type="hidden" name="MAX_FILE_SIZE" value="102476800" />';
   html += '<input type="hidden" name="uploadType" value="image" />';
	html += '<input class="uploadStuff window_resize" id="uploadedfile" name="uploadedfile" type="file" size="30"/>';
	html += '<input class="button button-blank" id="select_upload_file" value="'+getHTMLString(502025)+'" type="button">';
	html += '<input type="submit" id="fwRestore" style="display:none;">';
	html += '</form>';
	
	return html;
}

function page_settings_fw_updload_form_Func_Load(){
    $('#installUpdate').remove();
    $('#uploadedfile_form').after('<input id="installUpdate" class="button button-blank" value="'+getHTMLString('PAGE_FIRMWARE_UPDATE_USB_FIRMWARE_UPDATE_INSTALL_UPDATE_BUTTON')+'" style="display:none;" type="button">'); //Install Update
    
    $('#uploadedfile').fileupload({
        dataType: 'json',
        add: function (e, data) {
            if(false && window.console) console.log("#uploadedfile add");
            
            data.context = $('#installUpdate').on('click', function () {
				if(false && window.console) console.log("#installUpdate click");
				
				$('.popup').html(page_settings_fw_update_confirm_HtmlStr());
				
				$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
				$('.popup, .blackBackground').fadeIn();
				
				//.popup .button-apply
				$('.popup .button-apply').click(function(){
					if(false && window.console) console.log(".popup .button-apply click");
					
					var restore_time = 20; //sec
					var full_width = 316; //#progress-bar-image(px)
					
					var tmp_restore = 0;
					$('.popup').html(page_settings_fw_update_progress_HtmlStr());
					$('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
					
					setTimeout(settingsFWupdate, 1000);
					
					function settingsFWupdate(){
						tmp_restore++;
						var tmp_width = (full_width / restore_time);
						var now_width = tmp_restore * tmp_width;
						
						$('#progress-bar-image').css('width', now_width +'px');
						
						if(full_width > now_width){
							setTimeout(settingsFWupdate, 1000);
						}else{
							page_data_reload();
						}
					}
					
					//send file
					var tmpAction = $('#fwRestore').closest('form').attr('action').split('?')[0];
					$('#fwRestore').closest('form').attr('action', tmpAction + '?_=' + new Date().getTime() + '&csrf_token=' + csrf_token);
					
					data.submit();
				});
				
				//.popup .button-cancel
				$('.popup .button-cancel').on('click', function () {
					if(false && window.console) console.log(".popup .button-cancel click");
					
					$('.popup, .blackBackground').fadeOut();
				});
			});
			
			var file_name = data.files[0].name;
			var tmp_name = file_name.split('.');
			var sub_file_name = tmp_name[tmp_name.length-1];
				
			var html = '';
			if(sub_file_name == 'img'){
				$('#uploadedfile_form').hide();
				$('#installUpdate').show();
				
				$('#manual_fw_file').removeClass('notification');
				
				html += '<span class="bold" style="position: relative;">' + file_name.slice(0, -1-parseInt(sub_file_name.length,10)) +' ';
				html += '<img id="del1" alt="" style="position: absolute; left: 242px; top: 1px;" src="img/look_4/icons/close-icons/darkClose.png"></img>';
				html += '</span>';
			}else{
				html += '<span class="error">';
				html += '<span id="lang502022">'+getHTMLString(502022)+'</span>';
				html += '</span>';
			}
			$('#manual_fw_file').html(html);
				
			//#del1
			$('#del1').click(function(){
				if(false && window.console) console.log("#del1 click");
				$('#uploadedfile_form').show();
				$('#installUpdate').hide();
				
				$('#manual_fw_file').addClass('notification');
				
				var html = '';
				html += '<span id="lang502010">'+getHTMLString(502010)+'</span>';
				$('#manual_fw_file').html(html);
				
				$('#uploadedfile_form').html(page_settings_fw_updload_form_HtmlStr());
				$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
				//$('#uploadedfile_form').width($('#select_upload_file').outerWidth(true));
				$('.window_resize').on('window_resize', function(){
					$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
				});
				
				page_settings_fw_updload_form_Func_Load();
			});
        },
        done: function (e, data) {
			if(false && window.console) console.log("#uploadedfile done");
        }
    });
}

function page_data_reload(){
	$('.popup, .blackBackground').fadeOut();
	
	$('#uploadedfile_form').show();
	$('#installUpdate').hide();
	
	$('#manual_fw_file').addClass('notification');
	
	var html = '';
	html += '<span id="lang502010">'+getHTMLString(502010)+'</span>';
	$('#manual_fw_file').html(html);
	
	$('#uploadedfile_form').html(page_settings_fw_updload_form_HtmlStr());
	$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
	//$('#uploadedfile_form').width($('#select_upload_file').outerWidth(true));
	$('.window_resize').on('window_resize', function(){
		$('#uploadedfile').width($('#select_upload_file').outerWidth(true));
	});
	
	page_data_load("settings_fw_update");
}

$(function () {
	//#select_file
	$('#select_file').click(function(){
		if(false && window.console) console.log("#select_file click");
		
		$('#uploadedfile').trigger('click');
	});
	
	$('.window_resize').on('pre_window_resize', function(){
		if(false && window.console) console.log('pre_window_resize');
		
		$('#content').hide();
	});
	$('.window_resize').on('window_resize', function(){
		if(false && window.console) console.log('window_resize');
		
		$('#content').show();
	});
});
