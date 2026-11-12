
$(function () {
	//input#reset
	$('input#reset').click(function(){
		if(logMessage && window.console) console.log("input#reset click");
		//
		var img_restart =new Image();
		img_restart.src = "img/icon-thinking.gif";
		img_restart.id = "progress-bar-thinking-icon";
		//
		
		var html = '';
		html += '<div class="mobile-cancel-popup button-cancel"></div>';
		html += '<p class="title"><span id="lang507031">'+getHTMLString(507031)+'</span></p>';
		html += '<div class="row big">';
		html += '<div class="left">';
		html += '<span id="lang507032">'+getHTMLString(507032)+'</span>';
		html += '</div>';
		html += '</div>';
		html += '<div class="clearfix apply-cancel">';
		html += '<input id="applyButton" class="button button-apply scm-apply" value="'+getHTMLString(700001)+'" type="button">';
		html += ' ';
		html += '<input id="cancelButton" class="button button-cancel" value="'+getHTMLString(700002)+'" type="button">';
		html += '</div>	';
		
		$('.popup.tL').html(html);
		
		$('body, html').animate({ scrollTop: scrollTopByObject($('#content')) });
		$('.popup, .blackBackground').fadeIn();
		
		$('.scm-apply').bind("click",function(){
			if(logMessage && window.console) console.log(".scm-apply click");
			
			settingsConfigurationResetFactory.set("1", null, "settings_configuration");
			delCookie("pageid");	
			
			var reset_time = 30; //sec
			var restart_time = 180; //sec
			var full_width = 316; //#progress-bar-image(px)
			
			var tmp_reset = 0;
			var tmp_restart = 0;
			
			var html = '';
			html += '<p class="title"><span id="lang507024">'+getHTMLString(507024)+'</span></p>';
			html += '<div class="row big">';
			html += '<div class="full">';
			html += '<span id="lang507025">'+getHTMLString(507025)+'</span></div>';
			html += '</div>';
			html += '<div class="tC">';
			html += '<div id="progress-bar-box" style="margin: 0 auto;">';
			html += '<div id="progress-bar-image"></div>';
			html += '</div>';
			html += '</div>';
			
			$('.popup.tL').html(html);
			
			$('#progress-bar-image').css('width', '1px'); //0px=0% 316px=100%
			
			setTimeout(settingsResetFactory, 1000);
			
			function settingsResetFactory(){
				tmp_reset++;
				var tmp_width = (full_width / reset_time);
				var now_width = tmp_reset * tmp_width;
				
				$('#progress-bar-image').css('width', now_width +'px');

				if(full_width > now_width){
					setTimeout(settingsResetFactory, 1000);
				}else{
					var html = '';
					html += '<p class="title"><span id="lang507034">'+getHTMLString(507034)+'</span></p>';
					html += '<div class="row big">';
					html += '<div class="left">';
					html += '<span id="lang507027">'+getHTMLString(507027)+'</span></div>';
					html += '</div>';
					html += '<div class="row big">';
					html += '<div id="progress-bar-thinking-box" class="tC" style="border-top: medium none;">';
					//html += '<img id="progress-bar-thinking-icon" src="img/icon-thinking.gif" />';
					html += '</div>';
					html += '</div>';
			
					$('.popup.tL').html(html);
					//
					document.getElementById("progress-bar-thinking-box").appendChild(img_restart);
					//
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
	
});
