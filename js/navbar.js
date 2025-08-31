// navbar.js - Simple navbar component

function loadNavbar() {
    const navbarHTML = `
        <div class="header_menu affix-top">
            <nav class="navbar navbar-default">
                <div class="container">
                    <div class="navbar-header">
                        <a class="navbar-brand" href="index.html">
                            <img alt="logo1" src="images/logo-black.png" class="logo-black">
                        </a>
                        <a class="navbar-brand" href="index.html">
                            <img alt="logo1" src="images/logo.png" class="logo-white">
                        </a>
                    </div>
                    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                        <ul class="nav navbar-nav" id="responsive-menu">
                            <li class="dropdown submenu active">
                                <a href="index.html" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Home</a>
                            </li>
                            <li class="submenu dropdown">
                                <a href="roomlist-2.html" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Rooms</a>
                            </li>
                            <li class="submenu dropdown">
                                <a href="aboutus1.html" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Calendar</a>
                            </li>
                            <li class="submenu dropdown">
                                <a href="restaurant.html" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Restaurant</a>
                            </li>
                            <li class="submenu dropdown">
                                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">About US</a>
                            </li>
                            <li class="submenu dropdown">
                                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Contact US</a>
                            </li>
                            <li class="dropdown submenu">
                                <a href="cart.html" class="mt_cart"><i class="fa fa-shopping-cart"></i><span class="number-cart">1</span></a>
                            </li>
                            
                        </ul>
                        <div class="nav-btn">
                            <a href="../availability.html" class="btn btn-orange">Book Now</a>
                        </div>
                    </div>
                </div>
                <div id="slicknav-mobile"></div>
            </nav>
        </div>
    `;
    document.getElementById('navbar').innerHTML = navbarHTML;
    console.log("navbar loaded");
}

loadNavbar();