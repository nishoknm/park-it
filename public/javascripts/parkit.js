var SVG = new Class({
    //Constructor of SVG;
    initialize: function(svg) {
        this.svg = svg;
        this.svgNS = "http://www.w3.org/2000/svg";
    },
    //draw a rectangle;
    drawRectangle: function(id, x, y, w, h, fill, stroke, stroke_width) {
        var myRect = document.createElementNS(this.svgNS, "rect");
        myRect.setAttributeNS(null, "id", id);
        myRect.setAttributeNS(null, "x", x);
        myRect.setAttributeNS(null, "y", y);
        myRect.setAttributeNS(null, "width", w);
        myRect.setAttributeNS(null, "height", h);
        myRect.setAttributeNS(null, "fill", fill);
        myRect.setAttributeNS(null, "stroke", stroke);
        myRect.setAttributeNS(null, "stroke-width", stroke_width);
        this.svg.appendChild(myRect);
    },
    //draw a line
    drawLine: function(id, x1, y1, x2, y2, stroke, stroke_width) {
        var myLine = document.createElementNS(this.svgNS, "line");
        myLine.setAttributeNS(null, "id", id);
        myLine.setAttributeNS(null, "x1", x1);
        myLine.setAttributeNS(null, "y1", y1);
        myLine.setAttributeNS(null, "x2", x2);
        myLine.setAttributeNS(null, "y2", y2);
        myLine.setAttributeNS(null, "stroke", stroke);
        myLine.setAttributeNS(null, "stroke-width", stroke_width);
        this.svg.appendChild(myLine);
    }
});
var CustomEvent = new Class({
    events: [],
    addEventlistener: function(a, b) {
        this.events[a] = this.events[a] || [];
        if (this.events[a]) {
            this.events[a].push(b);
        }
    },
    removeEventlistener: function(c, d) {
        var a, b;
        if (this.events[c]) {
            b = this.events[c];
            for (a = b.length - 1; a >= 0; --a) {
                if (b[a] === d) {
                    b.splice(a, 1);
                    return true;
                }
            }
        }
        return false;
    },
    dispatch: function(c) {
        if (this.events[c]) {
            var b = this.events[c],
                a = b.length;
            while (a--) {
                b[a](this);
            }
        }
    }
});

//Enum used to map the icon based on availability
var availabilityStateEnum = {
    noStatus: {
        value: 0,
        desc: 'no status available',
        code: "noStatus"
    },
    noAvail: {
        value: 1,
        desc: 'no availability',
        code: "noAvail"
    },
    someAvail: {
        value: 2,
        desc: 'some availability',
        code: "someAvail"
    },
    highAvail: {
        value: 3,
        desc: 'high availability',
        code: "hiAvail"
    }
};

//ParkItPage holds standalone functions
var ParkItPage = {};
ParkItPage.parkitMap = null;
ParkItPage.currentRegion = null;
ParkItPage.currentPosition = {
    lat: 40.857611,
    lng: -74.2024167
};
ParkItPage.radius = 2000;
ParkItPage.rightPanel = null;
ParkItPage.selectedMarker = null;
ParkItPage.LAT = 40.857611;
ParkItPage.LNG = -74.2024167;
ParkItPage.ZOOM = 15;
ParkItPage.ZoomLevel = ParkItPage.ZOOM;
ParkItPage.MinimumZoomLevel = 10;
ParkItPage.MaximumZoomLevel = 25;
ParkItPage.defaultDetailsZoom = 16;
ParkItPage.defaultRegionZoom = 13;
ParkItPage.infoWindow = null;
ParkItPage.directionsService = null;
ParkItPage.directionsDisplay = null;
ParkItPage.distanceService = null;
ParkItPage.customEvents = null;
ParkItPage.autocompleteMarker = null;
ParkItPage.icons = {
    noStatusPt: 'Images/noStatus_pt.png',
    noStatus: 'Images/noStatus.png',
    noAvail: 'Images/noAvail.png',
    someAvail: 'Images/loAvail.png',
    hiAvail: 'Images/hiAvail.png'
};
//Constructor which initializes infowindow, directionService distance service etc from googlemaps
ParkItPage.initialize = function() {
    this.rightPanel = document.getElementById('right-panel');
    this.autocompleteInput = document.getElementById('pac-input');
    this.infoWindow = new google.maps.InfoWindow();
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsService = new google.maps.DirectionsService;
    this.distanceService = new google.maps.DistanceMatrixService;
    this.autocompleteMarker = new google.maps.Marker({
        map: this.parkitMap,
        anchorPoint: new google.maps.Point(0, -29)
    });
    this.customEvents = new CustomEvent();
};
/*
Opens an info box on the marker
Param:content - content html string to be loaded within infobox
Param:marker - marker on which the info box has to be displayed
*/
ParkItPage.openInfoWindow = function(content, marker) {
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.parkitMap, marker);
};
/*
Computes the direction and displays the route using googlemap's direction and display service
Param:start - orgin
Param:dest - destination
*/
ParkItPage.calculateAndDisplayRoute = function(start, dest) {
    if (!$("#pDetails").hasClass("inactive")) $("#pDetails").toggleClass("inactive");
    this.directionsDisplay.setMap(this.parkitMap);
    this.directionsDisplay.setPanel(this.rightPanel);
    this.directionsService.route({
        origin: start,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING
    }, (function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            this.directionsDisplay.setDirections(response);
            window.openmenu();
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    }).bind(this));
};
/*
Fetches and displays parking slot's information into Park-It menu
This API will work only if there is a selected marker(Parking slot)
*/
ParkItPage.displayParking = function() {
    var curMarker = ParkItPage.selectedMarker;
    ParkItPage.directionsDisplay.setPanel(null);
    if ($("#pDetails").hasClass("inactive")) {
        $("#pDetails").toggleClass("inactive");
        $.ajax({
            url: "/getPlaceDetails?placeId=" + curMarker.getPlace().place_id,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                var details = data.result;
                curMarker.setDetails(details);
                $("#lName").text(details.name);
                $("#address").text(details.formatted_address);
                $("#pNum").text(details.formatted_phone_number);
                $("#tSpace").text(curMarker.getTotal());
                $("#aSpace").text(curMarker.getAvail());
                window.openmenu();
            },
            error: function(error) {
                console.log(error);
            }
        });
    } else {
        var details = curMarker.getDetails();
        $("#lName").text(details.name);
        $("#address").text(details.formatted_address);
        $("#pNum").text(details.formatted_phone_number);
        $("#tSpace").text(curMarker.getTotal());
        $("#aSpace").text(curMarker.getAvail());
        window.openmenu();
    }

};
/*
Handler invoked when opening indoorMap on selected marker(Parking slot) which creates the SVG component
for indoor map only once and updates the slots from availabity status
*/
ParkItPage.displayIndoorMap = function() {
    var curMarker = ParkItPage.selectedMarker;
    if (!ParkItPage.mySvg) {
        ParkItPage.mySvg = new SVG(document.getElementById('floor3'));
        for (var i = 0; i < 19; i++) {
            this.mySvg.drawRectangle("col" + 0 + "r" + i, 22, 71 + i * 20, 39, 18, "green", "none", 0);
            this.mySvg.drawRectangle("col" + 5 + "r" + i, 459, 71 + i * 20, 39, 18, "green", "none", 0);
        }
        for (var i = 0; i < 20; i++) {
            this.mySvg.drawLine(null, 20, 70 + i * 20, 20 + 40, 70 + i * 20, "black", 2);
            this.mySvg.drawLine(null, 460, 70 + i * 20, 460 + 40, 70 + i * 20, "black", 2);
        }
        for (var i = 0; i < 13; i++) {
            this.mySvg.drawRectangle("col" + 1 + "r" + i, 139, 141 + i * 20, 39, 18, "green", "none", 0);
            this.mySvg.drawRectangle("col" + 2 + "r" + i, 182, 141 + i * 20, 39, 18, "green", "none", 0);
            this.mySvg.drawRectangle("col" + 3 + "r" + i, 299, 141 + i * 20, 39, 18, "green", "none", 0);
            this.mySvg.drawRectangle("col" + 4 + "r" + i, 342, 141 + i * 20, 39, 18, "green", "none", 0);
        }
        for (var i = 0; i < 14; i++) {
            this.mySvg.drawLine(null, 140, 140 + i * 20, 140 + 80, 140 + i * 20, "black", 2);
            this.mySvg.drawLine(null, 300, 140 + i * 20, 300 + 80, 140 + i * 20, "black", 2);
        }
    }
    curMarker._isIndoorMapOpen = true;
    curMarker.updateIndoorMap();
};
/*
Handler invoked on closing the indoor map
 */
ParkItPage.hideIndoorMap = function() {
    ParkItPage.selectedMarker._isIndoorMapOpen = false;
};

/*
Marker object holds all information and functions for the pertaining marker
 */
var Marker = {};
Marker = function() {
    this._marker = null;
    this._position = null;
    this._place = null;
    this._region = null;
    this._details = null;
    this._formattedAddress = '';
    this._icon = '';
    this._avail = 0;
    this._total = 0;
    this._isOnMap = false;
    this._timer = null;
    this._isIndoorMapOpen = false;
    this._availabilityState = availabilityStateEnum.noStatus;
    /*
    constructor creating google maps marker and does all the necessary marker functionality such 
    as storing the marker title etc.
     */
    this.initialize = function() {
        this._marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP
        });
        if (arguments[0].place) this.setPlace(arguments[0].place);
        if (arguments[0].title) this.setTitle(arguments[0].title);
        if (arguments[0].icon) this.setIcon(arguments[0].icon);
        if (arguments[0].position) this.setPosition(arguments[0].position);
        if (arguments[0].region) this.setRegion(arguments[0].region);
        this.setMap(ParkItPage.parkitMap);

        google.maps.event.addListener(this._marker, 'click', function() {
            ParkItPage.selectedMarker = this;
            if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
                ParkItPage.openInfoWindow('<div class="info" style="text-align:center" onclick=\'ParkItPage.displayParking()\'>' + this.getTitle() + '</div>', this._marker);
                ParkItPage.calculateAndDisplayRoute(ParkItPage.currentPosition.lat + "," + ParkItPage.currentPosition.lng, this.getPlace().geometry.location.lat + "," + this.getPlace().geometry.location.lng);
                ParkItPage.currentRegion._forceMarker = this;
            } else if (ParkItPage.ZoomLevel >= ParkItPage.defaultRegionZoom) {
                ParkItPage.parkitMap.setZoom(ParkItPage.defaultDetailsZoom);
                ParkItPage.parkitMap.setCenter(this.getPosition());
            } else {
                ParkItPage.parkitMap.setZoom(ParkItPage.defaultDetailsZoom);
                ParkItPage.parkitMap.setCenter(z.marker.getPosition());
            }
        }.bind(this));

        ParkItPage.customEvents.addEventlistener("viewport_change", this.setAvailability.bind(this));
        this.getAvailability();
        this.setAvailability();
    };
    this.setIcon = function(icon) {
        var anchorPoint = new google.maps.Point(19, 21);
        var newImage = new google.maps.MarkerImage(
            icon,
            new google.maps.Size(48, 48),
            new google.maps.Point(0, 0),
            anchorPoint);
        this._marker.setIcon(newImage);
    };
    this.getIcon = function() {
        return _marker.getIcon();
    };
    this.setPosition = function(pos) {
        this._position = pos;
        this._marker.setPosition(this._position);
    };
    this.getPosition = function() {
        return this._position;
    };
    this.setTitle = function(title) {
        this._marker.setTitle(title);
    };
    this.getTitle = function() {
        return this._marker.getTitle();
    };
    this.setDetails = function(details) {
        this._details = details;
    };
    this.getDetails = function() {
        return this._details;
    };
    this.getRegion = function() {
        return this._region;
    };
    this.setRegion = function(region) {
        this._region = region;
    };
    this.getAvail = function() {
        return this._avail;
    };
    this.setAvail = function(avail) {
        this._avail = avail;
    };
    this.getTotal = function() {
        return this._total;
    };
    this.setTotal = function(total) {
        this._total = total;
    };
    this.setPlace = function(place) {
        this._place = place;
    };
    this.getPlace = function() {
        return this._place;
    };
    this.getMarker = function() {
        return this._marker;
    };
    this.getMap = function() {
        return this._marker.getMap();
    };
    this.setMap = function(map) {
        this._marker.setMap(map);
    };
    this.getDistance = function() {
        return this._place.distance.value;
    };
    /*
    Fetches the availability status for the marker(parking place) and
    recalls itself for every 8 seconds to update the status
     */
    this.getAvailability = function() {
        if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom) {
            if (this._timer) window.clearTimeout(this._timer);
            this._timer = window.setTimeout(this.getAvailability.bind(this), 8 * 1000);
            var currentMarker = this;
            $.ajax({
                url: "/getAvailability?placeId=" + currentMarker.getPlace().place_id,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    currentMarker.availabilityCallback(data.item, data.status);
                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
    };
    //callback for getAvailability web service
    this.availabilityCallback = function(item, status) {
        if (status === "ok") {
            this._item = item;
            this.setAvail(item.avail);
            this.setTotal(item.total);
            this.setAvailability();
            //update the indoor map only if opened
            if (this._isIndoorMapOpen) {
                this.updateIndoorMap();
            }
            //computes the best direction only when we get the status of all the markers
            if (this._isFinal) {
                this.getRegion().computeBestAvailableDirection();
            }
        }
    };
    //Sets the availability, icon etc to the marker
    this.setAvailability = function() {
        if (this.getAvail() <= 5) {
            this._availabilityState = availabilityStateEnum.noAvail;
        } else if (this.getAvail() < 10) {
            this._availabilityState = availabilityStateEnum.someAvail;
        } else if (this.getAvail() >= 10) {
            this._availabilityState = availabilityStateEnum.highAvail;
        }
        if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom && ParkItPage.ZoomLevel < ParkItPage.defaultDetailsZoom) {
            image = ParkItPage.icons["noStatusPt"];
        } else if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
            image = ParkItPage.icons[this._availabilityState.code];
        }
        this.setIcon(image);
    };
    //updates the marker status to the indoor map
    this.updateIndoorMap = function() {
        for (var i in this._item.parkmap) {
            var j = i.substr(1);
            if (this._item.parkmap[i] == 1) {
                $("#col0r" + j).css({
                    fill: 'green'
                });
            } else {
                $("#col0r" + j).css({
                    fill: 'red'
                });
            }
        }
    };
    //Deletes and clears the marker information from google maps and markers array
    this.destroy = function() {
        if (this._timer) window.clearTimeout(this._timer);
        this.getMarker().setMap(null);
    };
}

/*
ParkItRegion is created based on the search, example - if one redoes the search
new ParkItRegion is created.
TODO: cache or delete object references of old park regions
 */
var ParkItRegion = new Class({
    Implements: [Chain, Events, Options],
    options: {
        markers: []
    },
    //Contructor
    initialize: function(pos, radius) {
        this.getRegionData(pos, radius);
    },
    //Fetches the region data by firing web service to backend node server
    getRegionData: function(pos, radius) {
        var currentRegion = this;
        $.ajax({
            url: "/getData?latitude=" + pos.lat + "&longitude=" + pos.lng + "&radius=" + radius,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                var deferredObject = currentRegion.regionDataCallback(data.results, data.status);
                deferredObject.done(function() {
                    console.log("Got all markers");
                    currentRegion.getMarkers().sort(function(a, b) {
                        var aDis = a.getDistance();
                        var bDis = b.getDistance();
                        return ((aDis < bDis) ? -1 : ((aDis > bDis) ? 1 : 0));
                    });
                });
            },
            error: function(error) {
                console.log(error);
            }
        });
    },
    //callback for getRegionData
    regionDataCallback: function(results, status) {
        var deferredObject = $.Deferred();
        var finalB = false;
        var currentRegion = this;
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                result = results[i];
                //passes final boolean to the final marker
                if (i == results.length - 1) finalB = true;
                /*
                call to compute distance and duration
                TODO : https://github.com/nishoknm/park-it/issues/4
                 */
                ParkItPage.distanceService.getDistanceMatrix({
                    origins: [ParkItPage.currentPosition],
                    destinations: [result.geometry.location],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC,
                    avoidHighways: false,
                    avoidTolls: false
                }, this.distanceServiceCallback(result, deferredObject, finalB));
            }
        }
        return deferredObject;
    },
    //callback for getDistanceMatrix service
    distanceServiceCallback: function(result, deferredObject, finalB) {
        var currentRegion = this;
        return function(response, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                result.distance = response.rows[0].elements[0].distance;
                result.duration = response.rows[0].elements[0].duration;
                var marker = currentRegion.createMarker(result);
                //Pushes all  markers to the current region
                currentRegion.getMarkers().push(marker);
                //sets final boolean to the final marker
                if (finalB) {
                    marker._isFinal = true;
                    deferredObject.resolve();
                }
            }
        };
    },
    //Creates place marker
    createMarker: function(place) {
        var placeLoc = place.geometry.location;
        var marker = new Marker();
        marker.initialize({
            position: placeLoc,
            title: place.name,
            place: place,
            region: this
        });
        return marker;
    },
    getMarkers: function() {
        return this.options.markers;
    },
    //deletes each marker
    destroy: function() {
        for (var i = 0; i < this.getMarkers().length; i++) {
            this.getMarkers()[i].destroy();
        }
    },
    //Algorithm for computing best direction
    computeBestAvailableDirection: function() {
        for (var i = 0; i < this.getMarkers().length; i++) {
            var marker = this.getMarkers()[i];
            //doesnt compute for forced marker or if the current marker is the best 
            if (!this._forceMarker && marker.getAvail() > 0) {
                if (this._bestMarker != marker) {
                    ParkItPage.calculateAndDisplayRoute(ParkItPage.currentPosition.lat + "," + ParkItPage.currentPosition.lng, marker.getPlace().geometry.location.lat + "," + marker.getPlace().geometry.location.lng);
                    this._bestMarker = ParkItPage.selectedMarker = marker;
                }
                break;
            }
        }
    }
});

//callback for google map loading
function initMap() {

    ParkItPage.parkitMap = new google.maps.Map(document.getElementById('map'), {
        center: ParkItPage.currentPosition,
        zoom: 15
    });

    ParkItPage.initialize();

    //autocomplete service from google maps API
    var autocomplete = new google.maps.places.Autocomplete(ParkItPage.autocompleteInput);
    autocomplete.bindTo('bounds', ParkItPage.parkitMap);

    autocomplete.addListener('place_changed', function() {
        ParkItPage.infoWindow.close();
        ParkItPage.autocompleteMarker.setVisible(false);
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("Autocomplete's returned place contains no geometry");
            return;
        }

        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            ParkItPage.parkitMap.fitBounds(place.geometry.viewport);
        } else {
            ParkItPage.currentPosition = place.geometry.location.toJSON();
            ParkItPage.parkitMap.setCenter(place.geometry.location);
            ParkItPage.parkitMap.setZoom(15);
            loadParkItRegion(ParkItPage.currentPosition);
        }
        ParkItPage.autocompleteMarker.setPosition(place.geometry.location);
        ParkItPage.autocompleteMarker.setVisible(true);
        ParkItPage.openInfoWindow('<div class="info" style="text-align:center">' + place.name + '</div>', ParkItPage.autocompleteMarker);
    });

    google.maps.event.addListener(ParkItPage.parkitMap, 'zoom_changed', function() {
        if (this.getZoom() < ParkItPage.MinimumZoomLevel) {
            ParkItPage.parkitMap.setZoom(ParkItPage.MinimumZoomLevel);
            return;
        }
        if (this.getZoom() > ParkItPage.MaximumZoomLevel) {
            ParkItPage.parkitMap.setZoom(ParkItPage.MaximumZoomLevel);
            return;
        }
        ParkItPage.zoomChange = true;
        ParkItPage.ZoomLevel = this.getZoom();
        ParkItPage.customEvents.dispatch("viewport_change");
        return;
    });
    callCurrentLocation();
}

function callCurrentLocation() {
    //Current location
    navigator.geolocation.getCurrentPosition(function(pos) {
        ParkItPage.currentPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
        };
        ParkItPage.autocompleteInput.value = null;
        ParkItPage.autocompleteMarker.setPosition(ParkItPage.currentPosition);
        ParkItPage.autocompleteMarker.setVisible(true);
        ParkItPage.openInfoWindow('<div class="info" style="text-align:center">Your Current Location</div>', ParkItPage.autocompleteMarker);
        loadParkItRegion(ParkItPage.currentPosition);
    });
}

/*
Loads park regions based on position
Param:pos
 */
function loadParkItRegion(pos) {
    if (ParkItPage.currentRegion) {
        ParkItPage.directionsDisplay.setMap(null);
        ParkItPage.directionsDisplay.setPanel(null)
        ParkItPage.currentRegion.destroy();
    }
    pos = pos ? pos : ParkItPage.currentPosition;
    ParkItPage.parkitMap.setCenter(pos);
    ParkItPage.currentRegion = new ParkItRegion(pos, ParkItPage.radius);
}
