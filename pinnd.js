/** 
 * pinnd.js Javascript plugin for floating content
 * @author Pony Smith - pony@ponysmith.com
 */

var pinnd = function(opts) {
	// Set a flag for enabled
	var _on = null;
	// Set a reference for the timeout
	var _t = null;
	// Store classes names
	var _c = {
		placeholder: 'pinnd-placeholder',
		pinnedtop: 'pinnd-top',
		pinnedbottom: 'pinnd-bottom'

	}
	// Default options 
	var _o = {
		selector: '.pinnd',
		offset: 0,
		context: 'body',
		zindex: 5
	}
	// Array for storing pinable elements
	var _e = [];
	// Keep a reference of the window for future use
	var _w = $(window);

	// Private object
	var _private = {

		/** 
		 * Initialize the plugin
		 */
		init: function(opts) {
			// Import user options
			$.extend(_o, opts);

			// Loop through all elements returned by the selector
			$(_o.selector).each(function() {
				// Create an object for each element
				var e = {};
				// Set the initial status
				e.status = 'home';
				// Store a reference to the jQuery obj
				e.jq = $(this);
				// Set context
				e.context = (e.jq.parents(_o.context).length) ? e.jq.parents(_o.context) : $(document);
				// Store the initial inline styles (for reset)
				e.styles = e.jq.attr('style');
				// Set up the element
				_private.setup(e);
				// Do initial check
				_private.check(e);
				// Add the element to the elements collection
				_e.push(e);
			});

			// Enable the plugin
			_public.enable();

			// Return the public object
			return _public;
		}, 

		/** 
		 * Scroll function bound to scroll / resize
		 */
		scroll: function() {
			for(var i = 0, l = _e.length; i<l; i++) {
				var e = _e[i];
				_private.check(e);
			}
		},

		/** 
		 * Resize function bound to window resize
		 */
		resize: function() {
			// Set and clear a timeout so that it only fires once per resize cycle
			clearInterval(_t);
			_t = setTimeout(function() {
				for(var i = 0, l = _e.length; i<l; i++) {
					var e = _e[i];
					_private.reset(e);
					// Only check and pin if pinning is enabled
					if(_on) _private.check(e);
				}
			}, 300);
		},

		/** 
		 * Setup the placeholder and pinpoints for an element
		 * @param (obj) e: The element for which to create/update the placeholder
		 */
		setup: function(e) {
			// Create / update the placeholder
			e.ph = _private.getPlaceholder(e);
			e.jq.wrap(e.ph);
			// Set the current pin points
			_private.setPinPoints(e);
		},

		/** 
		 * Reset items
		 * @param (obj) e: The element for which to update the trigger points
		 */
		reset: function(e) {
			// Temporarily remove the placeholder and return the element to its original position
			// This will allow it to grab any updated styles due to the resize
			e.jq.unwrap(e.ph);
			e.ph = null;
			_private.unpin(e);
			// Re-setup the element
			_private.setup(e);
		},

		/** 
		 * Create or update a placeholder
		 * @param (obj) e: The element for which to create/update the placeholder
		 */
		getPlaceholder: function(e) {
			// Create the placeholder if there isn't already one for this element
			var ph = e.ph || $('<div />').addClass(_c.placeholder);
			// Copy necessary styles from the element
			ph.css(e.jq.css(['float','position','clear','display']));
			// Make sure we're taking margins into account when setting height
			ph.css({ 'height': e.jq.outerHeight(true), 'width': e.jq.outerWidth(true) });
			return ph;
		},

		/** 
		 * Update the pin position values for the element
		 * @param (obj) e: The element for which to update the pin points
		 */
		setPinPoints: function(e) {
			// Set the offset for pinToTop (use the element if not pinned yet, placeholder otherwise)
			e.min = (e.status == 'home') ? e.jq.offset().top - _o.offset : e.ph.offset().top - _o.offset;
			// Set the offset for pinToBottom
			e.max = (e.context.offset().top + e.context.outerHeight(true)) - (e.jq.outerHeight(true) + _o.offset);
		},

		/** 
		 * Check whether to pin/unpin an element
		 * @param (obj) e: The element to check
		 */
		check: function(e) {
			switch(true) {
				case (_w.scrollTop() <= e.min): _private.unpin(e); break;
				case (_w.scrollTop() >= e.max): _private.pinToBottom(e); break;
				default: _private.pinToTop(e); break;
			}
		},

		/** 
		 * Pin element to top of viewport
		 * @param (obj) e: The element to pin
		 */
		pinToTop: function(e) {
			if(e.status == 'pinned-top') return false;
			e.status = 'pinned-top';
			e.jq.css({ 'position':'fixed', 'height':e.jq.height(), 'width':e.jq.width(), 'top':_o.offset, 'z-index':_o.zindex });
			e.jq.removeClass(_c.pinnedbottom).addClass(_c.pinnedtop);
			if(typeof _o.onpintop == 'function') _o.onpintop(e.jq);
		},

		/** 
		 * Pin element to bottom of context element
		 * @param (obj) e: The element to pin
		 */
		pinToBottom: function(e) {
			if(e.status == 'pinned-bottom') return false;
			// If the item hasn't pinned to the top yet, pinToTop so styles are set
			// This could happen if the page loads with some elements already in pinned-bottom state (and won't have had width applied via pinToTop)
			if(e.status != 'pinned-top') _private.pinToTop(e);
			e.status = 'pinned-bottom';
			e.jq.css({ 'position':'absolute', 'top':'auto', 'bottom':0 });
			e.jq.removeClass(_c.pinnedtop).addClass(_c.pinnedbottom);
			if(typeof _o.onpinbottom == 'function') _o.onpinbottom(e.jq);
		},

		/** 
		 * Return element to original position
		 * @param (obj) e: The element to unpin
		 */
		unpin: function(e) {
			if(e.status == 'home') return false;
			e.status = 'home';
			// Remove all inline styles and restore initial styles
			e.jq.removeAttr('style').attr('style',e.styles);
			e.jq.removeClass(_c.pinnedtop).removeClass(_c.pinnedbottom);
			if(typeof _o.onunpin == 'function') _o.onunpin(e.jq);
		}

	}


	// Public object
	var _public = {

		/** 
		 * Bind events
		 */
		enable: function() {
			_on = true;
			// Bind scroll and resize events
			_w.on('scroll', _private.scroll);
			_w.on('resize', _private.resize);
			// Call scroll method to pin any necessary elements
			_private.scroll();
		},

		/** 
		 * Unbind events
		 */
		disable: function() {
			_on = false;
			// Unbind scroll event
			// Not unbinding resize since we still want the elements/placeholders to resize when window resizes
			_w.off('scroll', _private.scroll);
			// Reset all elements
			for(var i = 0, l = _e.length; i<l; i++) {
				var e = _e[i];
				_private.reset(e);
			}
		},

	}

	return _private.init(opts);

}