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
ParkItPage.customEvents = null;
ParkItPage.autocompleteMarker = null;
ParkItPage.icons = {
    noStatusPt: 'Images/noStatus_pt.png',
    noStatus: 'Images/noStatus.png',
    noAvail: 'Images/noAvail.png',
    someAvail: 'Images/loAvail.png',
    hiAvail: 'Images/hiAvail.png'
};
ParkItPage.initialize = function() {
    this.rightPanel = document.getElementById('right-panel');
    this.autocompleteInput = document.getElementById('pac-input');
    this.infoWindow = new google.maps.InfoWindow();
    this.directionsDisplay = new google.maps.DirectionsRenderer;
    this.directionsService = new google.maps.DirectionsService;
    this.autocompleteMarker = new google.maps.Marker({
        map: this.parkitMap,
        anchorPoint: new google.maps.Point(0, -29)
    });
    this.customEvents = new CustomEvent();
};
ParkItPage.openInfoWindow = function(content, marker) {
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.parkitMap, marker);
};
ParkItPage.calculateAndDisplayRoute = function(start, dest) {
    this.directionsDisplay.setMap(this.parkitMap);
    this.directionsDisplay.setPanel(this.rightPanel);
    this.directionsService.route({
        origin: start,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING
    }, (function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            this.directionsDisplay.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    }).bind(this));
}


var Marker = {};
Marker = function() {
    this._marker = null;
    this._position = null;
    this._place = null;
    this._formattedAddress = '';
    this._icon = '';
    this._isOnMap = false;
    this._timer = null;
    this._availabilityState = availabilityStateEnum.noStatus;

    this.initialize = function() {
        this._marker = new google.maps.Marker({
            animation: google.maps.Animation.DROP
        });
        if (arguments[0].place) this.setPlace(arguments[0].place);
        if (arguments[0].title) this.setTitle(arguments[0].title);
        if (arguments[0].icon) this.setIcon(arguments[0].icon);
        if (arguments[0].position) this.setPosition(arguments[0].position);
        this.setMap(ParkItPage.parkitMap);

        google.maps.event.addListener(this._marker, 'click', function() {
            ParkItPage.selectedMarker = this;
            if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
                ParkItPage.openInfoWindow('<div style="text-align:center">' + this.getTitle() + '</div>', this._marker);
                ParkItPage.calculateAndDisplayRoute(ParkItPage.currentPosition.lat + "," + ParkItPage.currentPosition.lng, this._place.geometry.location.lat + "," + this._place.geometry.location.lng);
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
    this.getAvailability = function() {
        if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom) {
            if (this._timer) window.clearTimeout(this.timer);
            this._timer = window.setTimeout(this.getAvailability.bind(this), 8 * 1000);
            var currentMarker = this;
            $.ajax({
                url: "/getAvailability?placeId=" + currentMarker.getPlace().place_id,
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    currentMarker.availabilityCallback(data.results, data.status);
                },
                error: function(error) {
                    alert(error);
                }
            });
        }
    };
    this.availabilityCallback = function(results, status) {
        this.setAvailability();
    };
    this.setAvailability = function() {
        if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom && ParkItPage.ZoomLevel < ParkItPage.defaultDetailsZoom) {
            image = ParkItPage.icons["noStatusPt"];
        } else if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
            image = ParkItPage.icons[this._availabilityState.code];
        }
        this.setIcon(image);
    };
}

var ParkItRegion = new Class({
    Implements: [Chain, Events, Options],
    options: {
        markers: []
    },
    initialize: function(pos, radius) {
        this.getRegionData(pos, radius);
    },
    getRegionData: function(pos, radius) {
        var currentRegion = this;
        $.ajax({
            url: "/getData?latitude=" + pos.lat + "&longitude=" + pos.lng + "&radius=" + radius,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                currentRegion.regionDataCallback(data.results, data.status);
            },
            error: function(error) {
                alert(error);
            }
        });
    },
    regionDataCallback: function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                this.getMarkers().push(this.createMarker(results[i]));
            }
        }
    },
    createMarker: function(place) {
        var placeLoc = place.geometry.location;
        var marker = new Marker();
        marker.initialize({
            position: placeLoc,
            title: place.name,
            place: place
        });
        return marker;
    },
    getMarkers: function() {
        return this.options.markers;
    },
    destroy: function() {
        for (var i = 0; i < this.getMarkers().length; i++) {
            this.getMarkers()[i]._marker.setMap(null);
        }
    }
});

function initMap() {

    ParkItPage.parkitMap = new google.maps.Map(document.getElementById('map'), {
        center: ParkItPage.currentPosition,
        zoom: 15
    });

    ParkItPage.initialize();

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
        ParkItPage.openInfoWindow('<div style="text-align:center">' + place.name + '</div>', ParkItPage.autocompleteMarker);
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
        ParkItPage.openInfoWindow('<div style="text-align:center">Your Current Location</div>', ParkItPage.autocompleteMarker);
        loadParkItRegion(ParkItPage.currentPosition);
    });
}

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
