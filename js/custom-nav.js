	// home2 header
	 var navbar=$('.main_header_area .header_menu');
    var nav_offset_top = $('.header_menu').offset().top + 85;
    /*-------------------------------------------------------------------------------
	  Navbar 
	-------------------------------------------------------------------------------*/

	navbar.affix({
	  offset: {
	    top: nav_offset_top,
	  }
	});


	navbar.on('affix.bs.affix', function() {
		if (!navbar.hasClass('affix')){
			navbar.addClass('animated slideInDown');
		}
	});
    
    navbar.on('affixed-top.bs.affix', function() {
	  	navbar.removeClass('animated slideInDown');
	});



	
"use strict";


/*======== Doucument Ready Function =========*/
jQuery(document).ready(function () {

      // slicknav
    /**
     * Slicknav - a Mobile Menu
     */
    var $slicknav_label;
    $('.responsive-menu').slicknav({
      duration: 500,
      easingOpen: 'easeInExpo',
      easingClose: 'easeOutExpo',
      closedSymbol: '<i class="fa fa-plus"></i>',
      openedSymbol: '<i class="fa fa-minus"></i>',
      prependTo: '#slicknav-mobile',
      allowParentLinks: true,
      label:"" 
    });

    var $slicknav_label;
    $('#responsive-menu').slicknav({
      duration: 500,
      easingOpen: 'easeInExpo',
      easingClose: 'easeOutExpo',
      closedSymbol: '<i class="fa fa-plus"></i>',
      openedSymbol: '<i class="fa fa-minus"></i>',
      prependTo: '#slicknav-mobile',
      allowParentLinks: true,
      label:"" 
    });

    
    /**
     * Sticky Header
     */
        
    $(window).scroll(function(){

      if( $(window).scrollTop() > 10 ){

        $('.navbar').addClass('navbar-sticky-in')

      } else {
        $('.navbar').removeClass('navbar-sticky-in')
      }

    })
    
    /**
     * Main Menu Slide Down Effect
     */
     
    var selected = $('#navbar li');
    // Mouse-enter dropdown
    selected.on("mouseenter", function() {
        $(this).find('ul').first().stop(true, true).delay(350).slideDown(500, 'easeInOutQuad');
    });

    // Mouse-leave dropdown
    selected.on("mouseleave", function() {
        $(this).find('ul').first().stop(true, true).delay(100).slideUp(150, 'easeInOutQuad');
    });

    /**
     *  Arrow for Menu has sub-menu
     */
    if ($(window).width() > 992) {
      $(".navbar-arrow ul ul > li").has("ul").children("a").append("<i class='arrow-indicator fa fa-angle-right'></i>");
    }

    /**
     * Authentication State Management
     */
    
    // Check authentication status and update navigation
    function updateAuthNavigation() {
        // If the page already has the account dropdown (booking/confirmation header), let page-specific logic handle it
        if (document.getElementById('accountDropdown')) {
            return;
        }

        var authToken = localStorage.getItem('authToken');
        var userInfo = localStorage.getItem('userInfo');
        
        if (authToken && userInfo) {
            try {
                var user = JSON.parse(userInfo);
                // Show user info and logout button (for pages without the dropdown header)
                $('.links-right .auth-btn').hide();
                // Avoid duplicating injected items
                $('.links-right .user-info, .links-right #logoutBtn').remove();
                $('.links-right').prepend(`
                    <li class="user-info">
                        <i class="fa fa-user" aria-hidden="true"></i> Welcome, ${user.name || user.email || 'User'}
                    </li>
                    <li>
                        <a href="#" class="logout-btn" id="logoutBtn">
                            <i class="fa fa-sign-out" aria-hidden="true"></i> Logout
                        </a>
                    </li>
                `);
                
                // Bind logout event
                $('#logoutBtn').on('click', function(e) {
                    e.preventDefault();
                    logout();
                });
            } catch (e) {
                console.error('Error parsing user info:', e);
                clearAuthData();
            }
        } else {
            // Show sign in and sign up buttons
            $('.links-right .user-info, .links-right #logoutBtn').remove();
            $('.links-right .auth-btn').show();
        }
    }
    
    // Logout function
function logout() {
    // Use route guard logout if available
    if (window.routeGuard && typeof window.routeGuard.logout === 'function') {
        window.routeGuard.logout();
    } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        updateAuthNavigation();
        
        // Redirect to home page if not already there
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
}
    
    // Clear authentication data
    function clearAuthData() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        updateAuthNavigation();
    }
    
    // Initialize authentication navigation
    updateAuthNavigation();
    
    // Listen for storage changes (in case user logs in/out in another tab)
    $(window).on('storage', function(e) {
        if (e.key === 'authToken' || e.key === 'userInfo') {
            updateAuthNavigation();
        }
    });


});



