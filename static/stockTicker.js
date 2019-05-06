/* ************************************************************************************** */
/*                                                                                        */
/*   ©Bitbenderz.com ... 2017                                                             */
/*                                                                                        */
/*   @ project : jQuery stockTicker Lite                                                  */
/*   @ author  : tom@bitbenderz.com                                                       */
/*   @ version : 1.1.0                                                                    */
/*   @ updated : July, 2017                                                               */
/*   @ licnese : Dual licensed under ...                                                  */
/*               MIT (http://www.opensource.org/licenses/mit-license.php)                 */
/*               GPL (http://www.opensource.org/licenses/gpl-license.php)                 */
/*                                                                                        */
/* ************************************************************************************** */
(function($){

	"use strict"

	$.fn.stockTicker = function(options, args){

		return this.each(function(){

			$.fn.stockTicker.default = {
				type       : 'ltr',
				symbols    : '.DJI, .IXIC, .SPX, .GSPTSE, .N225',
				theme 	   : 'default',
				refresh    : 300,
				hoverPause : true,
				speed      : 34
			};

			$.fn.stockTicker.settings = $.extend({}, $.fn.stockTicker.default, options || {});

			if(!$(this).data().clone){$(this).data().clone = this.outerHTML;};

			if (methods[options]){
				return methods[options].call(this, Array.prototype.slice.call( arguments, 1 ), args);
			} else if (typeof options === 'object' || ! options){
				return methods.init.call(this, Array.prototype.slice.call(arguments, 1), args);
			} else {
				$.error( 'Method ' +  options + ' does not exist on jQuery.stockTicker' );
			};

		});

	};
            
	var methods = {
		init : function(options, args) {

			var who = $(this);
			var settings = $.fn.stockTicker.settings;

			/*  Clean Symbols Array  */
			var sa = settings.symbols.toUpperCase();
			sa = $.fn.stockTicker.cleanArray(sa.split(',')).join();

			/*  Set Element Properties  */
			who.attr('data-symbols', sa)
			   .attr('data-refresh', parseInt(settings.refresh, 10) < 10 ? 10 : parseInt(settings.refresh, 10))
			   .attr('data-pause', Number(settings.hoverPause))
			   .attr('data-speed', parseInt(settings.speed, 10))
			   .addClass(settings.theme)
			   .addClass(settings.type.toUpperCase());


			/*  Build Blank Ticker */
			$.fn.stockTicker.buildTicker(who);

			if(arguments[0].length == 1){who.trigger('ready');};

			/*  Populate Data  */
			$.fn.stockTicker.qetQuoteData(who);
		},

		refresh : function(options) {

			var who = $(this);
			$.fn.stockTicker.qetQuoteData(who);

		},

		remove : function(options) {

			var who = $(this);

			var di = Number(who.attr('data-index'));
			clearInterval($.fn.stockTicker.tickTimer[di]);
			clearInterval($.fn.stockTicker.refreshTimer[di]);

			who.html('');
			who.replaceWith(who.data().clone);
		},
	};

	/* ************************************	*/
	/* Build Ticker				*/
	/* ************************************	*/
	$.fn.stockTicker.buildTicker = function(who){

		who.addClass('stockTicker');

		who.width(Math.ceil(who.parent().width()) - 2);

		var c = $('.stock-ticker').length;
		var sa = who.attr('data-symbols').split(',');

		var out = '';

		out += '<div class="mWrap stock-ticker"><div class="mMove">';
		for(var i =0; i < sa.length; i++){
		    out += '<span class="mItem tickerSymbol" data-quote="' + $.trim(sa[i].toUpperCase()) + '"></span>';
		};
		out += '</div></div><i class="af ajaxBg"></i>';

		who.html(out);
		who.attr('data-index', c);

	};

	/* ************************************	*/
	/* Get Quote Data 			*/
	/* ************************************	*/
	$.fn.stockTicker.qetQuoteData = function(who){

		who.find('i.ajaxBg').removeClass('hide');
		var idx = who.attr('data-index');

		var sa = who.attr('data-symbols').split(',');

		if(sa.length == 1){sa.push('MSFT');};

		var ss = encodeURI(sa).split(',').join('%7C');

		var proto = window.location.protocol === 'file:' ? 'http:' : window.location.protocol;

		var url = proto + '//quote.cnbc.com/quote-html-webservice/quote.htm?symbols='+ss+'&symbolType=symbol&requestMethod=quick&exthrs=1&extMode=&fund=1&entitlement=0&skipcache=1&extendedMask=1&partnerId=2&output=jsonp&noform=1&who='+idx+'&callback=?';

		var request = $.getJSON(url, function(data){});
		request.always(function(xhr, stat, et){
			var u = this.url.split('&who=')[1]; u = u.split('&')[0];
			var t = $('.stockTicker[data-index='+u+']');

			var di, r, x, nc, n, q, s, v, c, p, d, m, h, mw, min, dir, td, tdm, ah, spd, rr;

			/*  Get Ticker Index  */
			di = Number(t.attr('data-index'));

			/*  Stop Refresh Timer  */
			clearInterval($.fn.stockTicker.refreshTimer[di]);

			if(stat == 'success'){
				r = xhr.QuickQuoteResult.QuickQuote.length;
				x = xhr.QuickQuoteResult.QuickQuote;

				/*  Populate Stock Symbol Items  */
				for(var i = 0; i < r; i++){
	
					nc = t.clone(true);
					n = $.trim(x[i].name);
					q = $.trim(x[i].symbol);
					s = $.trim(x[i].shortName);
					v = $.trim(x[i].last);
					c = $.trim(x[i].change);
					p = $.trim(x[i].change_pct);
					d = c.indexOf('-') != -1 ? 'neg' : parseFloat(c) === 0 ? 'nil' : 'pos'; 
					d = n === '' ? '' : d;

					if(n !== ''){
						m = t.find('span[data-quote="' + q +'"]');
						h = $('<span class="'+d+'"><span class="name">' + n + '</span><span class="symbol">' + s + '</span><span class="val">' + v + '</span><i class="indicator"></i><span class="change">' + c.split('+').join('').split('-').join('') + '</span><span class="pct">' + p.split('+').join('').split('-').join('') + '</span></span><i class="pipe"></i>');
						m.attr('title', n);
						m.html(h);
					};
				};

				/*  Remove Blanks or Invalid Symbols  */
				t.find('.mItem').each(function(){
					if($(this).children().length === 0){$(this).remove();};
				});

				/*  Calculate Minimum Width & Fill Ticker */
				mw = t.find('.mWrap:eq(0)');
				min = Math.ceil(t.width());
				dir = t.hasClass('LTR') ? 'LTR' : 'RTL';

				$('<div class="tmpdiv stockTicker" style="position:absolute; width:100000px; left:0px; top:-400px;"></div>').appendTo('body');
				td = $('.tmpdiv'); 
				tdm = mw.clone(true);
				tdm.appendTo(td);
				ah = 0;
				tdm.find('.mItem').each(function(){ah += Math.ceil($(this).width());});
				while(ah < min*2){
					mw.find('.mMove').contents().clone(true).appendTo(tdm.find('.mMove'));
					ah = 0;
					tdm.find('.mItem').each(function(){ah += Math.ceil($(this).width());});
				};
				mw.html(tdm.html()).find('.mMove').width(ah + 1);
				td.remove();

				/*  Create Hover Event Listeners  */
				if(Number(t.attr('data-pause')) === 1){
					mw.off('mouseenter').on('mouseenter', function(e){
						$(this).addClass('pause');
					}).off('mouseleave').on('mouseleave', function(e){
						$(this).removeClass('pause');
					});
				};

				/*  Create Ticker Timer  */
				spd = Number(t.attr('data-speed'));
				clearInterval($.fn.stockTicker.tickTimer[di]);
				$.fn.stockTicker.tickTimer[di] = setInterval(function(){$.fn.stockTicker.scrollTicker(mw, dir);}, spd);

			};

			t.trigger('refresh');
			/*  Hide Ajax Loader  */
			setTimeout(function(){t.find('i.ajaxBg').addClass('hide');}, 1000);

			/*  Set Refresh Timer  */
			rr = stat === 'success' ? parseInt(t.attr('data-refresh'), 10)*1000 : 1000;
			$.fn.stockTicker.refreshTimer[di] = setInterval(function(){$.fn.stockTicker.qetQuoteData(t);}, rr);

		});

	};

	/* ************************************	*/
	/* Scroll Ticker                        */
	/* ************************************	*/
	$.fn.stockTicker.scrollTicker = function (who, dir){

		if(who.hasClass('pause')){return;};

		var mw = who.find('.mMove');
		var ew = Math.ceil(mw.width());
		var ci = mw.find('.mItem:eq(0)');
		var iw = Math.ceil(ci.width());
		var cl = mw.find('.mItem:last');
		var lw = Math.ceil(cl.width());

		if(dir === 'LTR'){
			mw.css('left', '-=1');
			var cp = Math.abs(parseInt(mw.css('left'), 10));

			if(cp === 2){
				var cc = ci.clone(true,true).appendTo(mw);
				mw.width(ew + iw);
			}else if(cp === iw){
				ci.remove();
				mw.css('left', '0px').width(ew-iw);
			};
		}else{
			var cp = Math.abs(parseInt(mw.css('left'), 10));

			if(cp === 0){
				var cc = cl.clone(true,true).prependTo(mw);
				mw.css('left', '-' + Math.ceil(cc.width()) + 'px').width(ew + Math.ceil(cc.width()));
			}else if(cp === 2){
				cl.remove();
				mw.width(ew - lw);
			};

			mw.css('left', '+=1');

		};
	};

	/* ************************************	*/
	/* Remove Blanks & Dupes From Array 	*/
	/* ************************************	*/
	$.fn.stockTicker.cleanArray = function (orgArray){
		var a = new Array();
		for(var i = 0; i < orgArray.length; i++){if (orgArray[i]){a.push(orgArray[i]);};};
		if(a.length > 0){var b=a.length, c;while(c=--b)while(c--)a[b]!==a[c]||a.splice(c,1);};
		return a;
	};

	/* ************************************	*/
	/* Init Ticker Timer Array              */
	/* ************************************	*/
	$.fn.stockTicker.tickTimer = new Array();

	/* ************************************	*/
	/* Init Refresh Timer Array             */
	/* ************************************	*/
	$.fn.stockTicker.refreshTimer = new Array();

})(jQuery);
