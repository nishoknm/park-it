var SidebarMenuEffects = (function() {
    function init() {
        var container = document.getElementById('st-container'),
            buttons = Array.prototype.slice.call(document.querySelectorAll('#st-trigger-effects > span')),
            eventtype = 'click',
            resetMenu = function() {
                classie.remove(container, 'st-menu-open');
            };
        buttons.forEach(function(el, i) {
            var effect = el.getAttribute('data-effect');
            window.openmenu = function() {
                if (!window._isMenuOpen) {
                    container.className = 'st-container'; // clear
                    classie.add(container, effect);
                    classie.add(el, "spanclasswhite");
                    setTimeout(function() {
                        classie.add(container, 'st-menu-open');
                    }, 25);
                    window._isMenuOpen = true;
                }
            };
            window.closemenu = function() {
                if (window._isMenuOpen) {
                    classie.remove(el, "spanclasswhite");
                    resetMenu();
                    window._isMenuOpen = false;
                }
            };
            el.addEventListener(eventtype, function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                if (!classie.has(container, 'st-menu-open')) {
                    window.openmenu();
                } else {
                    window.closemenu();
                }
            });
        });
    }
    init();
})();
