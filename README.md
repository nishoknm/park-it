# Park-It
    Javscript (node.js) based parking application
Parking assistance:
* 2000m parking places with availability status.
* Auto direction/navigation to the nearest parking slot based on availability.
* Indoor parking map, for more parking efficiency.

# Proposal:
    Web based parking assistance.

# Mission Statement:
    Develop a parking assist application purely using web based technologies such as HTML, css, 
    Javascript and its open sourced frameworks such as node.js, bootstrap, jQuery, jQuery UI etc.
    
# Summary:
  * Parking is a huge problem in most of the places, eventhough there are applications available in assisting, which is not sufficient. 
  * Park-It should overcome these issues by providing real time navigation to the closest parking space available.

# Outcome:
  * Phase 1: Based on the User's current location, Park-It will show the closest available parking space.

# Impact to society:
  Allows user to find a parking lot with empty spaces based on his location instead of running in circles or
  parking in no parking spaces.

# Architecture:
	Frameworks:
		Components:
			-Client:
				UI: Pure HTMLs, CSSs and JSs
				Structure (Controller and Model): 
					JQUERY:
						-AJAX calls
						-Deferred chaining
					MooTools:
						-OOPS in JS
			-Server:
				Web server:
					Node js server
			-Database:
				MongoDb

	Core:
		Google APIs:
			Maps Javascript
			Places Web services
			Direction services
			Distance matrix services
		MooTools classes:
			Park regions
			Markers
			
# Demo
![Alt text](artifacts\images\ParkItGIF.gif)
