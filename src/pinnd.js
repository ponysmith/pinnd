/**
 * pinnd.js Javascript plugin for floating content
 * @author Pony Smith - pony@ponysmith.com
 */

var pinnd = function(el, opts) {

  var _state = {
    enabled: true,
    pinnedTopOffset: null,
    pinnedBottomOffset: null
  }

  var _options = {
    context: 'body',
    offsetTop: 0,
    offsetBottom: 0,
    onPinTop: null,
    onPinBottom: null,
    onUnpin: null
  }

  var _elements = {
    el: el,
    placeholder: null
  }

  var _private = {

    init: function(el, opts) {
      // Merge options
      _private.mergeOptions(opts)
      // Set element references
      _elements.el = el;
      _elements.context = document.querySelector(_options.context);
      _elements.context.style.position = 'relative';
      _private.createPlaceholder();
      _private.calculateLimits();
      _public.on();
      return _public;
    },

    /**
     * Merge user options with defaults
     */
    mergeOptions: function(opts) {
      for(o in opts) {
        if(o in _options) _options[o] = opts[o];
      }
    },

    /**
     * Create the placeholder
     */
    createPlaceholder: function() {
      _elements.placeholder = _elements.placeholder || document.createElement('div');
      _elements.el.parentNode.insertBefore(_elements.placeholder, _elements.el);
      _private.updateElements();
    },

    /**
     * Update the element and placeholder
     */
    updateElements: function() {
      // Temporarily revert the pinned element to get any size adjustments
      _elements.el.style.removeProperty('width');
      _elements.el.style.removeProperty('height');
      _elements.el.style.position = 'static';
      _elements.placeholder.parentNode.insertBefore(_elements.el, _elements.placeholder);
      // Update dimensions
      _state.width = _elements.el.offsetWidth + 'px';
      _state.height = _elements.el.offsetHeight + 'px';
      _elements.placeholder.style.width = _state.width;
      _elements.placeholder.style.height = _state.height;
      // (re)wrap the pinnd element with the placeholder
      _elements.placeholder.appendChild(_elements.el);
    },

    /**
     * Calculate the upper and lower limits for pinning
     */
    calculateLimits: function() {
      _state.pinnedTopOffset = (
        _elements.placeholder.getBoundingClientRect().top -
        _options.offsetTop
      );
      _state.pinnedBottomOffset = (
        _elements.context.getBoundingClientRect().top +
        _elements.context.offsetHeight -
        _elements.el.offsetHeight -
        _options.offsetTop -
        _options.offsetBottom
      );
    },

    /**
     * Update the pin state
     */
    updatePinState: function() {
      _private.calculateLimits();
      switch(true) {
        case (_state.pinnedTopOffset > 0): _private.unpin(); break;
        case (_state.pinnedBottomOffset < 0): _private.pinBottom(); break;
        default: _private.pinTop(); break;
      }
    },

    /**
     * Unpin
     */
    unpin: function() {
      _elements.el.dataset.pinnd =  'none';
      Object.assign(_elements.el.style, {
        'position': 'static',
        'top': 'auto',
        'bottom': 'auto'
      });
      _elements.el.style.removeProperty('height');
      _elements.el.style.removeProperty('width');
      if(typeof _options.onUnpin == 'function') _options.onUnpin();
    },

    /**
     * Pin to top
     */
    pinTop: function() {
      _elements.el.dataset.pinnd =  'top';
      Object.assign(_elements.el.style, {
        'position': 'fixed',
        'top': _options.offsetTop + 'px',
        'bottom': 'auto',
        'width': _state.width,
        'height': _state.height,
        'box-sizing': 'border-box'
      });
      if(typeof _options.onPinTop == 'function') _options.onPinTop();
    },

    /**
     * Pin to bottom
     */
    pinBottom: function() {
      _elements.el.dataset.pinnd = 'bottom';
      Object.assign(_elements.el.style, {
        'position': 'absolute',
        'top': 'auto',
        'bottom': _options.offsetBottom + 'px'
      });
      if(typeof _options.onPinBottom == 'function') _options.onPinBottom();
    },

    /**
     * Wrapper function for onresize actions
     */
    resize: function() {
      _private.updateElements();
      _private.updatePinState();
    },

    /**
     * Enable pinning
     */
    enable: function() {
      _private.updateElements();
      _private.updatePinState();
      window.addEventListener('scroll', _private.updatePinState);
      window.addEventListener('resize', _private.resize);
    },

    /**
     * Disable
     */
    disable: function() {
      _private.unpin();
      window.removeEventListener('scroll', _private.updatePinState);
      window.removeEventListener('resize', _private.resize);
    }

  }

	// Public object
	var _public = {

		/**
		 * Turn on pinning
		 */
		on: function() {
      _state.enabled = true;
      _private.enable();
		},

		/**
		 * Turn off pinning
		 */
		off: function() {
      _state.enabled = false;
      _private.disable();
		}
	}

	return _private.init(el, opts);

}
