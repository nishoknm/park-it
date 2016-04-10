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
			
# Technical Document:
	Main Page:
		-index.html (park-it\views\index.html)
			<script src="https://maps.googleapis.com/maps/api/js?key=<KEY>&signed_in=true&libraries=places&callback=initMap" async defer></script>

			The above script loads the google map on the body and calls the callback "initMap" after loading the map.
			The initMap initializes ParkItPage , which is a utility and base class available throughout the lifecycle
			of one session. This class also holds methods such as openInfoWindow (google's info box for markers), 
			calculateAndDisplayRoute (googles directionsDisplay and directionsService API), displayParking (google 
			getPlaceDetails Ajax request), displayIndoorMap (displays indoor map).

			After initializing ParkItPage, initMap adds listeners such as zoom_changed, place_changed et Cetera then
			starts initializing ParkItRegion class, which fires getRegionData. The callback for getRegionData creates 
			the parking place markers. The place markers are created using a class Marker, which has an important 
			timer functions getAvailability, which gets the availability status of the particular marker. This timer
			function calls itself for every 8 minutes.

			When the autocomplete's address input changes with new location, the ParkItRegion will be re-initialized
			with a new position.

		
	Main Javascript:
		-parkit.js (park-it\public\javascripts\parkit.js)
		This js contains the following important classes:
			-ParkItPage class, which is standalone utility class having static methods such as calculateAndDisplayRoute,
			openInfoWindow et Cetera, is created only once during the entire lifecycle the web page.
			-ParkItRegion class, which is the main holder class created on every zoom changed or new location change,
			holds the API (getRegionData) for fetching parking information using google places nearby search AJAX and
			the API (createMarker) for creating markers on maps.
			-Marker class, which is placeholder class created for every parking slot , holds all the necessary API
			for that specific slot such as getAvailability , setIcon et Cetera

	Main Server Page:
		-index.js (park-it\routes\index.js)
		This is the main router for the backend server which processes all the AJAX request from the front-end including 
		google API AJAX calls. Google's Places API AJAX calls are re-directed to this route, then this route handles these
		requests with fail back.

		This js contains the following GET requests:
		-getData
		-getAvailability
		-getAllPlaceIds
		-getAllAvailability
		-removePlace
		-addAvailability
		-insertParkers
		-updateAvailability
		-addPlaceToGoogle
		-deletePlaceToGoogle
		-getPlaceDetails
# Demo
![Alt text](/artifacts/images/ParkItGIF.gif)
