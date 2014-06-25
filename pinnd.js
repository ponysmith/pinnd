/** 
 * pinnd.js Javascript plugin for floating content
 * @author Pony Smith - pony@ponysmith.com
 */

// Using UMD to make the plugin AMD compliant for use w/ RequireJS
// based on https://github.com/umdjs/umd
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], function (jQuery) {
            return (root.pinnd = factory(jQuery));
        });
    } else {
        root.pinnd = factory(root.jQuery);
    }
}(this, function ($) {

    // Now for our actual plugin code
	return function(jq, opts) {
		// Set a flag for enabled
		var _enabled = null;
		// Set a reference for the timeout
		var _timeout = null;
		// Store classes names
		var _classes = {
			placeholder: 'pinnd-placeholder',
			pinned: 'pinnd',
			pinnedtop: 'pinnd-top',
			pinnedbottom: 'pinnd-bottom'
		}
		// Default options 
		var _options = {
			autoenable: true,
			context: 'body',
			offset_top: 0,
			offset_bottom: 0,
			zindex: 5
		}
		// Array for storing pinable elements
		var _elements = [];
		// Keep a reference of the window for future use
		var _window = $(window);

		// Private object
		var _private = {

			/** 
			 * Initialize the plugin
			 */
			init: function(jq, opts) {
				// Import user options
				$.extend(_options, opts);
				// Loop through all elements returned by the selector
				jq.each(function() {
					// Create an object for each element
					var e = {};
					// Set the initial status
					e.status = 'unpinned';
					// Store a reference to the jQuery obj
					e.jq = $(this);
					// Set context and ensure that it has positioning
					e.context = (e.jq.parents(_options.context).length) ? e.jq.parents(_options.context) : $('body');
					if(e.context.css('position') == 'static') e.context.css('position', 'relative');
					// Store the initial inline styles (for reset)
					e.styles = e.jq.attr('style');
					// Add the element to the elements collection
					_elements.push(e);
				});

				// Enable the plugin
				if(_options.autoenable) _public.on();

				// Return the public object
				return _public;
			}, 

			/** 
			 * Setup/enable an element
			 */
			enable: function(e) {
				// Create the placeholder if there isn't already one for this element
				var ph = e.ph || $('<div />').addClass(_classes.placeholder);
				// Copy necessary styles from the element
				ph.css(e.jq.css(['float','position','clear','display','top','left','right','bottom']));
				// Make sure we're taking the element's margins into account when setting the placeholder height
				ph.css({ 'height': e.jq.outerHeight(true), 'width': e.jq.outerWidth(true) });
				e.ph = ph;
				// Wrap the element with the placeholder and store a reference
				e.jq.wrap(ph);
				// Remove all positioning from element as long as it has the placeholder
				e.jq.css('position','static');
				// Set the pin points for the element
				_private.setPinPoints(e);
				// Check the element to pin if necessary
				_private.check(e);
			},

			/** 
			 * Disable/reset an element
			 */
			disable: function(e) {
				// Remove the placeholder ... not deleting the reference, just unwrapping
				// Verify that the placeholder is in fact wrapping element before removing blindly
				if(e.jq.parent('.' + _classes.placeholder).length) e.jq.unwrap();
				_private.unpin(e);
			},

			/** 
			 * Scroll function
			 */
			scroll: function() {
				for(var i = 0, l = _elements.length; i<l; i++) {
					var e = _elements[i];
					_private.check(e);
				}
			},

			/** 
			 * Resize function
			 */
			resize: function() {
				if(!_enabled) return false;
				for(var i = 0, l = _elements.length; i<l; i++) {
					var e = _elements[i];
					// Temporarily unpin the element so we can get any updates to its size/position
					if(e.jq.parent('.' + _classes.placeholder).length) e.jq.unwrap();
					_private.unpin(e);
					// Call enable() to get any updates to the size/position caused by the resize
					_private.enable(e);
					// Call check() to (re)pin the element as necessary
					_private.check(e);
				}
			},

			/** 
			 * Update the pin position values for the element
			 * @param (obj) e: The element for which to update the pin points
			 */
			setPinPoints: function(e) {
				// Set the offset for pinToTop (use the element if not pinned yet, placeholder otherwise)
				e.min = (e.status == 'unpinned') ? e.jq.offset().top - _options.offset_top : e.ph.offset().top - _options.offset_top;
				// Set the offset for pinToBottom
				e.max = (e.context.offset().top + e.context.outerHeight(true)) - (e.jq.outerHeight(true) + _options.offset_top + _options.offset_bottom);
			},

			/** 
			 * Check whether to pin/unpin an element
			 * @param (obj) e: The element to check
			 */
			check: function(e) {
				switch(true) {
					case (e.min < 0 || _window.scrollTop() <= e.min): _private.unpin(e); break;
					case (_window.scrollTop() >= e.max): _private.pinToBottom(e); break;
					default: _private.pinToTop(e); break;
				}
			},

			/** 
			 * Pin element to top of viewport
			 * @param (obj) e: The element to pin
			 */
			pinToTop: function(e) {
				if(e.status == 'pinned-top') return;
				e.status = 'pinned-top';
				e.jq.css({ 'position':'fixed', 'height':e.jq.height(), 'width':e.jq.width(), 'top':_options.offset_top, 'bottom': 'auto', 'z-index':_options.zindex });
				e.jq.removeClass(_classes.pinnedbottom).addClass(_classes.pinnedtop).addClass(_classes.pinned);
				if(typeof _options.onpintop == 'function') _options.onpintop(e.jq);
			},

			/** 
			 * Pin element to bottom of context element
			 * @param (obj) e: The element to pin
			 */
			pinToBottom: function(e) {
				if(e.status == 'pinned-bottom') return;
				// If the item hasn't pinned to the top yet, pinToTop so styles are set
				// This could happen if the page loads with some elements already in pinned-bottom state 
				// (and won't have had width applied via pinToTop)
				if(e.status != 'pinned-top') _private.pinToTop(e);
				e.status = 'pinned-bottom';
				e.jq.css({ 'position':'absolute', 'top':'auto', 'bottom': _options.offset_bottom });
				e.jq.removeClass(_classes.pinnedtop).addClass(_classes.pinnedbottom).addClass(_classes.pinned);
				if(typeof _options.onpinbottom == 'function') _options.onpinbottom(e.jq);
			},

			/** 
			 * Return element to original position
			 * @param (obj) e: The element to unpin
			 */
			unpin: function(e) {
				// if(e.status == 'unpinned') return;
				e.status = 'unpinned';
				// Unwrap the placeholder
				// Remove all inline styles and restore initial styles
				e.jq.removeAttr('style').attr('style',e.styles);
				e.jq.removeClass(_classes.pinnedtop).removeClass(_classes.pinnedbottom).removeClass(_classes.pinned);
				if(typeof _options.onunpin == 'function') _options.onunpin(e.jq);
			}

		}


		// Public object
		var _public = {

			/** 
			 * Turn on pinning for the current group of elements
			 */
			on: function() {
				_enabled = true;
				// Bind scroll and resize events
				_window.on('scroll', _private.scroll);
				_window.on('resize', _private.resize);
				// Enable the elements
				for(var i = 0, l = _elements.length; i<l; i++) {
					var e = _elements[i];
					_private.enable(e);
				}		
			},

			/** 
			 * Turn off pinning for the current group of elements
			 */
			off: function() {
				_enabled = false;
				// Unbind scroll event
				// Not unbinding resize since we still want the elements/placeholders to resize when window resizes
				_window.off('scroll', _private.scroll);
				// Disable all elements
				for(var i = 0, l = _elements.length; i<l; i++) {
					var e = _elements[i];
					_private.disable(e);
				}
			},

		}

		return _private.init(jq, opts);

	}

}));