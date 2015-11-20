/********************************************************************************************************************************************************/

var Marker = {};
Marker = function() {
    this._marker = null;
    this._position = null;
    this._formattedAddress = '';
    this._icon = '';
    this._type = null;
    this._iconSet = null;
    this._isOnMap = false;
    this._filtered = false;
    this._spaceGroupItem = null;
    this._spaceGroupItemIsTrusted = false;
    this._region = null;
    this._availabilityState = null;
    this._numberOfSpaces = 0;
    this._totalCapacity = 0;
    this._InfoString = '';
    this._listeningToEvent = false;
    this._detailsHTML = '';
    this.actualParkingPolicy = null;
    this._currentTime = {};
    this._restriction = '';
    this._timespan = 0;
    this._parkingAllowed = false;
    this._parkingRestrictionDescription = '';
    this._meteredRate = -1;
    this._spaceObjects = [];
    this._PolicyGroupId = null;
    this._blockRestrictionByTime = [];
    this.initialize = function() {
        if (arguments[0].region) this._region = arguments[0].region;
        if (arguments[0].parent) this._spaceGroupItem = arguments[0].parent;
        this._marker = new google.maps.Marker();
        this._marker.parent = this;
        if (arguments[0].title) this.setTitle(arguments[0].title);
        if (arguments[0].icon) this.setIcon(arguments[0].icon);
        if (arguments[0].type) this.setType(arguments[0].type);
        if (arguments[0].position) this.setPosition(arguments[0].position);

        if (this._type == 'city') {
            this.setIcon("Images/ic_Parker_city.png");
            google.maps.event.addListener(this._marker, 'click', function() {
                ParkItPage.selectedMarker = null;
                if (ParkItPage.ZoomLevel <= ParkItPage.defaultDetailsZoom) {
                    ParkItPage.parkerMap.setZoom(ParkItPage.DEFAULTZOOM);
                    ParkItPage.parkerMap.setCenter(this.getPosition());
                }
            });
        } else {
            ParkItPage.customEvents.addEventlistener("viewport_change", this.setVisibleState.bind(this));
            ParkItPage.customEvents.addEventlistener("radius_change", this.setVisibleState.bind(this));

            google.maps.event.addListener(this._marker, 'click', function() {
                ParkItPage.selectedMarker = this;
                if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
                    ParkItPage.openInfoWindow('<div style="text-align:center">' + this._InfoString + '</div>', this._marker);
                } else if (ParkItPage.ZoomLevel >= ParkItPage.defaultRegionZoom) {
                    ParkItPage.parkerMap.setZoom(ParkItPage.defaultDetailsZoom);
                    ParkItPage.parkerMap.setCenter(this.getPosition());
                } else {
                    ParkItPage.parkerMap.setZoom(ParkItPage.defaultDetailsZoom);
                    ParkItPage.parkerMap.setCenter(z.marker.getPosition());
                }
            }.bind(this));
            if (this._type === 'garage' || this._type === 'lot') {
                this.parseAgregateInfo();
            } else {
                //get Space Objects for this block
                if (this._spaceGroupItem.parkingSpaceIds == null) {
                    check = true;
                }

                spaceGroups:
                    for (var k = 0; k < this._spaceGroupItem.parkingSpaceIds.length; k++) {
                        //this is potentialy available space object, check the policy to see if this is truely available 
                        space = this._region.spaces[this._spaceGroupItem.parkingSpaceIds[k] - 1];
                        if (space) {
                            space.available = true;
                            this._spaceObjects.push(space);
                        } else {
                            var faildId = this._spaceGroupItem.parkingSpaceIds[k] - 1;
                            space = this._region.spaces[this._spaceGroupItem.parkingSpaceIds[k] - 2];
                            if (space && space.id == this._spaceGroupItem.parkingSpaceIds[k] - 1) {
                                space.available = true;
                                this._spaceObjects.push(space);
                            } else {
                                console.error("space " + faildId + " could not be found")
                            }
                        }
                    }
            }
        };

        this._isOnMap = false;
        this.setVisibleState();
    };
    this.setIcon = function(icon) {
        if (this._marker) {
            var anchorPoint = new google.maps.Point(19, 21);
            if (this._type == 'block_face') anchorPoint = new google.maps.Point(18, 30);

            var newImage = new google.maps.MarkerImage(
                // url: 
                icon,
                // size: 
                new google.maps.Size(48, 48),
                // origin: 
                new google.maps.Point(0, 0),
                // anchor: 
                anchorPoint);

            this._marker.setIcon(newImage);
        }
    };
    this.getIcon = function() {
        return _marker.getIcon();
    };
    this.setTitle = function(title) {
        if (this._marker) {
            if (title) {
                this._marker.setTitle(title);
            } else {
                //compose title by availability and restriction parameters
                if (this._parkingRestrictionDescription.length) {
                    this._marker.setMap(null);
                    this._marker.setTitle(this._parkingRestrictionDescription + ' - ' + this._availabilityState.desc);
                    this._marker.setMap(ParkItPage.parkerMap);
                } else if (this._numberOfSpaces == 0) {
                    this._marker.setMap(null);
                    this._marker.setTitle(this._availabilityState.desc);
                    this._marker.setMap(ParkItPage.parkerMap);
                } else {
                    this._marker.setMap(null);
                    this._marker.setTitle(availabilityStateEnum.noStatus.desc);
                    this._marker.setMap(ParkItPage.parkerMap);
                }
            }
        }
        return true;
    };
    this.getSpaceGroupItemId = function() {
        return this._spaceGroupItem.id;
    };
    this.getTitle = function() {
        return this._marker != null ? this._marker.getTitle() : null;
    };
    this.setPosition = function(pos) {
        this._position = pos;
        if (this._type == 'block_face') {
            headingOffset = 90;
            OffsetMeter = 3;
            //If the block face side is 'high' then the block face icon should be at location.lat + 0.00006, location.long + 0.00008
            //If the block face side is 'low' then the block face icon should be at location.lat - 0.00006, location.long - 0.00008
            this._position.nb += -0.00006;
            this._position.ob += -0.00008;
            if (this._spaceGroupItem.side == 'high') {
                this._position.nb += 0.00006;
                this._position.ob += 0.00008;
            }
        }
        this._marker.setPosition(this._position);
    };
    this.getPosition = function() {
        return this._position;
    };
    this.getMap = function() {
        return this.r != null ? this._marker.getMap() : null;
    };
    this.setMap = function(map) {
        this._marker.setMap(map);
    };
    this.setType = function(type) {
        this._type = type;
        switch (this._type) {
            case 'garage':
                this._iconSet = ParkItPage.garageIcons;
                break;
            case 'lot':
                this._iconSet = ParkItPage.garageIcons;
                break;
            case 'block':
                this._iconSet = ParkItPage.blockIcons;
                break;
            case 'block_face':
                this._iconSet = ParkItPage.blockFaceIcons;
                break;
            case 'zone':
                this._iconSet = ParkItPage.blockIcons;
                break;
            case 'space':
                this._iconSet = ParkItPage.offStreetIcons;
            case 'city':
                this._iconSet = ["Images/ic_Parker_city.png"];
                break;
        }
    };
    this.getMarker = function() {
        return this._marker;
    };
    this.removeListener = function() {
        ParkItPage.customEvents.removeEventlistener("viewport_change", this.setVisibleState().bind(this));
        return true;
    };
    this.parseAgregateInfo = function() {
        if (this._spaceGroupItem.parkingAggregates) {
            this._totalCapacity = 0;
            for (var i = 0; i < this._spaceGroupItem.parkingAggregates.length; i++) {
                if (this._spaceGroupItem.parkingAggregates[i].capacity) this._totalCapacity += this._spaceGroupItem.parkingAggregates[i].capacity;
            }
        }
    };
    this.getSpaceGroupPolicyGroupId = function(policyArray) {
        var PolicyGroupId = null;

        if (policyArray.length) {
            //find the policy with the most members
            members = 0;
            $.each(policyArray, function(n, m) {
                if (m && m > members) {
                    members = m;
                    PolicyGroupId = n;
                }
            });
        }
        this._PolicyGroupId = PolicyGroupId;
        return PolicyGroupId;
    };

    this.getRestrictionDetailByPolicyId = function(policyId) {
        d = new Date();
        //parktime = Date.UTC( d.getFullYear(),d.getMonth(),d.getDay(),d.getMinutes(),d.getSeconds());
        parktime = d;
        for (var k = 0; k < this._region.policies.length; k++) {
            if (policyId == this._region.policies[k].id) {
                thisPolicy = this._region.policies[k];
                policyStartTimeMSec = new Date(thisPolicy.startTime).getTime();
                restrictionId = -1;
                policyTimeMSec = policyStartTimeMSec;
                for (var i = 0; i < thisPolicy.segments.length; i++) {
                    policyTimeMSec = policyTimeMSec + (thisPolicy.segments[i][0] * 1000 * 60);
                    restrictionId = thisPolicy.segments[i][1];
                    if (parktime < policyTimeMSec) { // timespan reaches further than the time of parking                       
                        for (var p = 0; p < this._region.restrictionGroups.length; p++) {
                            restriction = this._region.restrictionGroups[p];
                            if (restriction.id == restrictionId) {
                                return restriction; //getRestriction
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }
    };

    this.setAvailability = function() {
        var tooltipString;
        if (this._isOnMap && this._marker.getVisible() && ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) {
            this._availabilityState = null;
            this._spaceGroupItemIsTrusted = false;
            this._numberOfSpaces = 0;
            switch (this._type) {
                case 'garage':
                    tooltipString = this._spaceGroupItem.title;
                    if (this._region.Availability) {
                        index = this._region.Availability.parkingAggregateIds.indexOf(this._spaceGroupItem.id);
                        try {
                            if (index != -1) {
                                if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 0) { //garage is available, continue                             
                                    this._numberOfSpaces = this._region.Availability.parkingAggregateAvailabilityCounts[index]; //sets the number of parking spaces available
                                    if (this._numberOfSpaces <= 40) {
                                        this._availabilityState = availabilityStateEnum.noAvail;
                                    } else if (this._numberOfSpaces < 80) {
                                        this._availabilityState = availabilityStateEnum.someAvail;
                                    } else if (this._numberOfSpaces >= 80) {
                                        this._availabilityState = availabilityStateEnum.highAvail;
                                    }
                                } else if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 1) { //no data available == noStatus
                                    this._availabilityState = availabilityStateEnum.noStatus;
                                } else if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 2) { //no data available == noStatus
                                    this._availabilityState = availabilityStateEnum.noAvail;
                                } else if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 3) { //no data available == noStatus
                                    this._availabilityState = availabilityStateEnum.someAvail;
                                } else if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 4) { //no data available == noStatus
                                    this._availabilityState = availabilityStateEnum.highAvail;
                                }
                            } else {
                                this._availabilityState = availabilityStateEnum.noStatus;
                            }
                        } catch (error) {
                            //alert(error);
                        }
                    } else {
                        this._availabilityState = availabilityStateEnum.noStatus;
                    }
                    this._spaceGroupItemIsTrusted = true; //Garages are always trusted, they might not have availability status info 
                    break;
                case 'block':
                case "zone":
                case 'block_face':
                    //find all spaces for this block and check their occupancy and trust-ability
                    this._numberOfSpaces = 0;
                    blockIsTrusted = false;
                    totalTrustedSpaces = 0;
                    spaceGroupPoliciesId = [];
                    availableSpaces = [];
                    if (this._region.Availability) {
                        if (this._region.id == 'sfpark') { //this is the one-off for the San Fransisco region on-street data
                            index = this._region.Availability.parkingAggregateIds.indexOf(this._spaceGroupItem.id);
                            try {
                                if (index != -1) {
                                    this._numberOfSpaces = this._region.Availability.parkingAggregateAvailabilityCounts[index]; //sets the number of parking spaces available                                       
                                } else {
                                    this._availabilityState = availabilityStateEnum.noStatus;
                                    this._numberOfSpaces = 0;
                                }
                                this._PolicyGroupId = this._spaceGroupItem.parkingAggregates[0].policyGroupId;
                                groupRestriction = this.getRestrictionDetailByPolicyId(this._PolicyGroupId);
                                this._meteredRate = groupRestriction.meteredRate;
                                this._parkingRestrictionDescription = groupRestriction.description;
                                if (!groupRestriction.parkingAllowed) {
                                    this._numberOfSpaces = 0;
                                }
                            } catch (error) {
                                this._numberOfSpaces = 0;
                            }
                            this._spaceGroupItemIsTrusted = true; //San Fran is always trusted.
                            totalTrustedSpaces = this._numberOfSpaces;
                        } else {
                            if (this._spaceGroupItem.parkingSpaceIds && this._spaceGroupItem.parkingSpaceIds.length > 0) {
                                $.each(this._spaceObjects, function(n, m) {
                                    if (this._region.Availability.trustabilityBitsDecoded.charAt(m.id - 1) == 1) {
                                        if (!blockIsTrusted) this._spaceGroupItemIsTrusted = true;
                                        totalTrustedSpaces++;
                                        if (spaceGroupPoliciesId[m.policyGroupId]) { // sets the block policy id
                                            spaceGroupPoliciesId[m.policyGroupId] = spaceGroupPoliciesId[m.policyGroupId] + 1;
                                        } else {
                                            spaceGroupPoliciesId[m.policyGroupId] = 1;
                                        }
                                    }
                                    if (this._region.Availability.trustabilityBitsDecoded.charAt(m.id - 1) == 1 && this._region.Availability.availabilityBitsDecoded.charAt(m.id - 1) == 1) {

                                        m.available = true;

                                        //get this spaces policy and restrictions
                                        for (var j = 0; j < this._region.policyGroups.length; j++) {
                                            if (m.policyGroupId == this._region.policyGroups[j].id) {
                                                restriction = this.getRestrictionDetailByPolicyId(this._region.policyGroups[j].policyIds[0]);
                                                if (!restriction.parkingAllowed) {
                                                    m.available = false;
                                                }
                                                break;
                                            }
                                        }
                                        if (m.available) availableSpaces.push(m);
                                    } else {
                                        m.available = false;
                                    }
                                }.bind(this));
                                this._numberOfSpaces = availableSpaces.length;
                                // check to see if the entire block needs to be excluded
                                if (spaceGroupPoliciesId.length) {
                                    groupRestriction = this.getRestrictionDetailByPolicyId(this.getSpaceGroupPolicyGroupId(spaceGroupPoliciesId));
                                    this._meteredRate = groupRestriction.meteredRate;
                                    this._parkingRestrictionDescription = groupRestriction.description;
                                    if (!groupRestriction.parkingAllowed) {
                                        this._numberOfSpaces = 0;
                                    }
                                } else {
                                    this._parkingRestrictionDescription = '';
                                }
                                if (totalTrustedSpaces < this._spaceGroupItem.parkingSpaceIds.length * 0.5) { //less than 50%
                                    this._spaceGroupItemIsTrusted = false;
                                }
                            } else {
                                this._numberOfSpaces = 0; //not trusted, already set
                            }
                            if (totalTrustedSpaces < this._numberOfSpaces) this._numberOfSpaces = totalTrustedSpaces;
                        }
                    } else {
                        this._numberOfSpaces = -1;
                        totalTrustedSpaces = 0;
                    }
                    this._totalCapacity = totalTrustedSpaces;
                    if (!this._spaceGroupItemIsTrusted) {
                        this._availabilityState = availabilityStateEnum.noStatus;
                        this._marker.setVisible(false);
                    } else if (this._numberOfSpaces == 0) {
                        this._availabilityState = availabilityStateEnum.noAvail;
                    } else if (this._numberOfSpaces == -1) {
                        this._availabilityState = availabilityStateEnum.noStatus;
                    } else if (totalTrustedSpaces > 0 && this._numberOfSpaces > 0) {
                        //percentage = ((this._numberOfSpaces*100)/totalTrustedSpaces).toFixed(0);
                        if (this._numberOfSpaces >= 4) {
                            this._availabilityState = availabilityStateEnum.highAvail;
                        } else if (this._numberOfSpaces >= 2) {
                            this._availabilityState = availabilityStateEnum.someAvail;
                        } else {
                            this._availabilityState = availabilityStateEnum.noAvail;
                        }
                    } else {
                        this._availabilityState = availabilityStateEnum.noStatus;
                    }
                    break;
                case 'space':
                    this._iconSet = ParkItPage.offStreetIcons;
                case 'city':
                    this._iconSet = ["Images/ic_Parker_city.png"];
                    break;
            };
            infostr = this._spaceGroupItem.title;
            if (infostr.length > 20) {
                infostr = infostr.substr(0, 19) + '...';
            }
            if (typeof this._region['Availability'] !== 'undefined' && this._type == 'garage') {
                if (this._region.Availability.parkingAggregateAvailabilityStates[index] == 0) {
                    //add the garage count to the infostring
                    infostr += '<br/>' + this._numberOfSpaces + ' spaces available now';
                } else {
                    infostr = infostr;
                }
            } else if (this._type == 'garage') {
                if (this._availabilityState == availabilityStateEnum.noStatus) {
                    infostr = infostr;
                } else if (this._availabilityState == availabilityStateEnum.noAvail) {
                    infostr += '<br/>No spaces available now';
                } else if (this._availabilityState == availabilityStateEnum.someAvail) {
                    infostr += '<br/>Some spaces available now';
                } else {
                    infostr += '<br/>Lots of spaces available now';
                }
            }

            link = "getParkingDetailHtml();";
            infostr = '<span style="color:black;font-weigth:bold;font-size:12px"><a  onClick="' + link + '" style="cursor:pointer">' + infostr + '</a></span><br/>';
            this._InfoString = infostr;
            titleSet = this.setTitle(tooltipString);
        }
        this.setMarkerIcon();
    };

    this.setMarkerIcon = function() {
        var image;
        //this._marker.setTitle(this._spaceGroupItem.title+' - '+this._availabilityState.desc);
        if (this._isOnMap && this._marker.getVisible()) {
            if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom && ParkItPage.ZoomLevel < ParkItPage.defaultDetailsZoom) { // this sets the default icon for the region view 
                image = this._iconSet[0];
            } else if (ParkItPage.ZoomLevel >= ParkItPage.defaultDetailsZoom) { //sets the details view for the parking option, needs availability data to determine the correct icon           
                image = this._iconSet[1][this._availabilityState.code];
            }
            this.setIcon(image);
        } else {
            this.setMap(null);
            this._isOnMap = false;
        }
        this._listeningToEvent = false;
        return;
    };

    this.removeMap = function() {
        this._marker.getMap(null);
    };

    this.filterVisibility = function() {
        if (this._marker.getVisible()) {
            this._marker.setVisible(true);
        }
        return true;
    };

    this.setVisibleState = function() {
        var isOnMap = this.getPosition() ? ParkItPage.parkerMap.getBounds().contains(this.getPosition()) : false;
        if (this._listeningToEvent) return;
        this._listeningToEvent = true;
        if (this._type == 'city') {
            if (!this._isOnMap && isOnMap) {
                this._isOnMap = true;
                this.setMap(ParkItPage.parkerMap);
            } else if (this._isOnMap && !isOnMap) {
                this._isOnMap = false;
                this.setMap(null);
            }
            if (this._isOnMap) {
                if (ParkItPage.ZoomLevel <= ParkItPage.defaultRegionZoom) {
                    this._marker.setVisible(true);
                } else {
                    this._marker.setVisible(false);
                }
            }
            this._listeningToEvent = false;
        } else {
            if (!isOnMap && this._isOnMap) {
                this.removeMap();
                this._isOnMap = false;
                this._listeningToEvent = false;
            } else if (isOnMap) { // this marker is on the map - check what type it is and if it is allowed to be seen      
                this._marker.setVisible(true);
                if (ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom) {
                    if (this._type == 'block' && ParkItPage.ZoomLevel > 17) {
                        this._marker.setVisible(false);
                        this._listeningToEvent = false;
                    } else if (this._type == 'block' && ParkItPage.ZoomLevel <= 17 && !this._marker.getVisible()) {
                        this._marker.setVisible(true);
                        this._listeningToEvent = true;
                    }
                    if (this._type == 'block_face' && ParkItPage.ZoomLevel <= 17) {
                        this._marker.setVisible(false);
                        this._listeningToEvent = false;
                    } else if (this._type == 'block_face' && ParkItPage.ZoomLevel > 17 && !this._marker.getVisible()) {
                        this._marker.setVisible(true);
                        this._listeningToEvent = true;
                    }
                    if (this._marker.getVisible()) {
                        if (!this._isOnMap) {
                            this.setMap(ParkItPage.parkerMap);
                            this._isOnMap = true;
                            if (this._type == 'block_face') {
                                if (arguments && arguments.length > 0) {
                                    if (arguments[0].position) this.setPosition(arguments[0].position);
                                }
                            }
                        }
                        if (!this._marker.getVisible()) this._marker.setVisible(true);
                        if (this.filterVisibility()) this.setAvailability();

                    }

                } else {
                    this._marker.setVisible(false);
                    this._listeningToEvent = false;
                }
            } else {
                this._listeningToEvent = false;
            }
        }

    };
};
/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/
var MapRegion = {};
MapRegion = function() {
    this.region = null;
    this.id = null;
    this.title = null;
    this.location = null;
    this.bounds = null;
    this.region = null;
    this.spaceAmount = null;
    this.location = null;
    this.spaceGroups = [];
    this.spaces = [];
    this.restrictions = [];
    this.policyGroups = [];
    this.policies = [];
    this.permits = [];
    this.Availablity = null;
    this.marker = null;
    this.timer = null;
    this.regionTimer = null;
    this.totalRegionCount = 0;
    this.spaceGroupCount = 0;
    this.lastFullJsonCall = null;
    this.initialize = function(a) {
        this.region = a;
        this.id = a.id;
        this.title = a.title;
        this.location = a.location;
        this.bounds = a.bounds;
        this.onMap = false;

    };

    this.parseRegionData = function(data) { //is called from the regions object when a viewport change is triggered
        if (!this.onMap) {
            this.spaceAmount = data.parkingRegion.spaces.length;
            this.location = data.parkingRegion.location;
            this.spaceGroups = data.parkingRegion.spaceGroups;
            this.spaces = data.parkingRegion.spaces;
            this.restrictionGroups = data.parkingRegion.restrictionGroups;
            this.policyGroups = data.parkingRegion.policyGroups;
            this.policies = data.parkingRegion.policies;
            this.permits = data.parkingRegion.permits;
            if (!this.onMap) this.onMap = true;
        }
        this.getAvailability(); //calls the availability data for this region
    };

    this.checkRegion = function() {
        ParkItPage.Regions.getRegionData(this);
        window.clearTimeout(this.regionTimer);
        this.regionTimer = setTimeout(this.checkRegion, 60 * 5 * 1000); //5 minutes timeout
    }.bind(this);

    this.getAvailability = function() { //this should be called in an 8 second interval for all active regions (regions on map) 
        if (this.onMap && ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom) {
            if (this.timer) window.clearTimeout(this.timer);
            this.timer = window.setTimeout(this.getAvailability, 8 * 1000);
            $.ajax({
                url: "/regions/availability/availability_" + this.id + ".json",
                statusCode: {
                    200: function(j, status) {
                        if (typeof(j) === 'string') {
                            j = jQuery.parseJSON(j);
                        }
                        this.Availability = j.availability;
                        this.parseAvailability();
                    }.bind(this),
                    304: function(j, status) {
                        if (this.Availability == null) {
                            this.Availability = j.availability;
                            this.parseAvailability();
                        }
                    }.bind(this)
                },

                error: function(a) {
                    console.warn('Oops! We were unable to establish a connection to our server!, no on-street data could be retreived.');
                    this.Availability = null;
                    this.parseAvailability();
                }.bind(this),

                success: function(j) {
                    this.Availability = j.availability;
                }.bind(this),

                timeout: function() {
                    console.warn("GetegionData Request Timeout :-(");
                }.bind(this)
            });
        } else if (this.onMap && ParkItPage.ZoomLevel < ParkItPage.defaultDetailsZoom) {
            this.setRegionMarkers();
        }
    }.bind(this);

    this.parseAvailability = function() { // this should parse the base64 and byte encoded availability strings if the api is not called in decoded mode
        if (this.Availability != null) {
            this.totalRegionCount = 0;
            for (var i = 0; i < this.Availability.availabilityBitsDecoded.length; i++) {
                try {
                    if (this.Availability.availabilityBitsDecoded.charAt(i) == 1 && this.Availability.trustabilityBitsDecoded.charAt(i) == 1) {
                        this.totalRegionCount++;
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
        this.setRegionMarkers();
    };

    this.setRegionMarkers = function() {
        //if(ParkItPage.ZoomLevel > ParkItPage.defaultRegionZoom)   {//check to see if we are displaying the region level icon or the details level icons
        this.spaceGroupCount = -1;
        $.each(this.spaceGroups, function(x, z) {
            this.spaceGroupCount++;
            if (z.kind == "city") {
                test = true;
            }
            if (z.kind == 'garage' || z.kind == "block" || z.kind == 'block_face' || z.kind == 'lot') { //check if all eligible spaceGroup items have a marker object
                if (z.marker) {
                    z.marker.setVisibleState(); //if yes, trigger their state function to determine their visibility and their icon
                } else {
                    z.marker = new Marker(); // if not, create a new object and initialize it
                    z.marker.initialize({
                        position: new google.maps.LatLng(z.location.latitude, z.location.longitude),
                        title: z.title,
                        type: z.kind,
                        parent: z,
                        region: this
                    });
                }
            }
        }.bind(this));

        if (this.marker == null) {
            this.marker = new Marker();
            this.marker.initialize({
                position: new google.maps.LatLng(this.region.location.latitude, this.region.location.longitude),
                title: this.title,
                type: 'city',
                parent: null,
                region: this
            });
        } else {
            this.marker.setVisibleState();;
        }
    };

    this.title = function() {
        return this.title;
    };
};

/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/
var ParkItRegions = new Class({
    Implements: [Chain, Events, Options],
    options: {
        regionsOnMap: []
    },
    mapbounds: {},
    map: {},
    initialize: function(a) {
        this.setOptions(a);
    },
    getRegion: function(map) {
        var thisRegion = {};
        //gets all regions that are intersecting with the view port of the map, this is called on every user interaction event with the map
        this.map = map;
        if (this.map !== undefined) {
            mapbounds = this.map.getBounds();
            this.clearRegionsOnMap(); //remove all regions that do not intersect with the view port         
            this.options.parkingRegions.each(function(region) {
                // create points, if bounds of the region do not exist, create new one
                if (!region.bounds) region.bounds = new google.maps.LatLngBounds(new google.maps.LatLng(region.mapRegion.latitude - region.mapRegion.latitudeDelta, region.mapRegion.longitude - region.mapRegion.longitudeDelta), new google.maps.LatLng(region.mapRegion.latitude + region.mapRegion.latitudeDelta, region.mapRegion.longitude + region.mapRegion.longitudeDelta));
                if (region.id === 'othergarages') {
                    if (!this.checkIsOnMap(region.id)) {
                        thisRegion = new MapRegion();
                        thisRegion.initialize(region);
                        this.getRegionsOnMap().push(thisRegion); // adds region to active region array if bounds intersect and not yet on Map
                        return false;
                    }
                } else {
                    //check if bounds intersect and map is not already included (onMap) in the options.regionsOnMap Array
                    isOnMap = this.checkIsOnMap(region.id);
                    if (mapbounds.intersects(region.bounds) && !isOnMap) {
                        thisRegion = new MapRegion();
                        thisRegion.initialize(region);
                        this.getRegionsOnMap().push(thisRegion); // adds region to active region array if bounds intersect and not yet on Map
                        return false;
                    }
                }
            }.bind(this));
            // loop through all regions on map and get their respective parking data
            $.each(this.getRegionsOnMap(), function(n, region) {
                window.clearTimeout(region.regionTimer);
                region.regionTimer = setTimeout(region.checkRegion, 60 * 5 * 1000); //5 minutes timeout
                this.getRegionData(region);
            }.bind(this));
        };
    },
    checkIsOnMap: function(id) {
        var check = false;
        $.each(this.getRegionsOnMap(), function(n, regionClass) {
            if (id === regionClass.id) check = true;
        });
        return check;
    },
    getRegionsOnMap: function() {
        return this.options.regionsOnMap;
    },
    clearRegionsOnMap: function() {
        //removes all regions not intersecting with actual view port
        $.each(this.options.regionsOnMap, function(x, regionOnMap) {
            try {
                if (!mapbounds.intersects(regionOnMap.bounds) && !(regionOnMap.id === 'othergarages')) {
                    this.options.regionsOnMap.splice(x, 1);
                    regionOnMap.onMap = false;
                    if (regionOnMap.timer) window.clearTimeout(regionOnMap.timer); //kills any subsequent availability calls if still scheduled
                    window.clearTimeout(regionOnMap.regionTimer);
                    $.each(regionOnMap.spaceGroups, function(x, z) { //remove all marker listeners and then the markers from the spaceGroup items in the region that has left the view port
                        if (['garage', 'block', 'block_face'].indexOf(z.kind) != -1) {
                            if (z.marker) {
                                success = z.marker.removeListener();
                                if (success) z.marker = null;
                            }
                        }
                    });
                }
            } catch (error) {
                //alert(error.messagge);
            }
        }.bind(this));
    },
    getRegionData: function(region) { //should be called every time the viewport is changing
        $.ajax({
            url: "/regions/" + region.id + ".json",
            statusCode: {
                200: function(j, status) {
                    if (typeof(j.parkingRegionList) == "undefined" && typeof(j) === 'string') {
                        j = jQuery.parseJSON(j);
                    }
                    region.parseRegionData(j);
                }.bind(this),
                304: function(j, status) {
                    region.parseRegionData(j);
                }.bind(this)
            },
            error: function(a) {
                alert('Oops! We were unable to establish a connection to our server!');
            },
            timeout: function() {
                console.warn("GetegionData Request Timeout :-(");
            }.bind(this)
        });
    }
});

/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/

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

/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/

var ParkItPage = {};
ParkItPage.parkerMap = null;
ParkItPage.selectedMarker = null;
ParkItPage.LAT = 40.857611;
ParkItPage.LNG = -74.2024167;
ParkItPage.ZOOM = 15;
ParkItPage.ZoomLevel = ParkItPage.ZOOM;
ParkItPage.MinimumZoomLevel = 10;
ParkItPage.MaximumZoomLevel = 25;
ParkItPage.defaultDetailsZoom = 16;
ParkItPage.defaultRegionZoom = 13;
ParkItPage.zoomChange = false;
ParkItPage.infoWindow = null;
ParkItPage.customEvents = null;
ParkItPage.garageIcons = ['Images/ic_garage_noStatus_pt.png', {
    noStatus: 'Images/ic_garage_noStatus.png',
    noAvail: 'Images/ic_garage_noAvail.png',
    someAvail: 'Images/ic_garage_loAvail.png',
    hiAvail: 'Images/ic_garage_hiAvail.png'
}];
ParkItPage.offStreetIcons = ['Images/ic_garage_noStatus_pt.png', {
    noStatus: 'Images/ic_street_noStatus.png',
    noAvail: 'Images/ic_street_noAvail.png',
    someAvail: 'Images/ic_street_loAvail.png',
    hiAvail: 'Images/ic_street_hiAvail.png'
}];
ParkItPage.blockIcons = ['Images/ic_garage_noStatus_pt.png', {
    noStatus: 'Images/ic_street_noStatus.png',
    noAvail: 'Images/ic_street_noAvail.png',
    someAvail: 'Images/ic_street_loAvail.png',
    hiAvail: 'Images/ic_street_hiAvail.png'
}];
ParkItPage.blockFaceIcons = ['Images/ic_garage_noStatus_pt.png', {
    noStatus: 'Images/ic_street_noStatus.png',
    noAvail: 'Images/low_block.png',
    someAvail: 'Images/some_block.png',
    hiAvail: 'Images/plenty_block.png'
}];
ParkItPage.initialize = function() {
    ParkItPage.LAT = 40.857611;
    ParkItPage.LNG = -74.2024167;
    ParkItPage.ZOOM = 15;
    ParkItPage.ZoomLevel = ParkItPage.ZOOM;
    this.customEvents = new CustomEvent();
};
ParkItPage.openInfoWindow = function(b, a) {
    var d = this;
    ParkItPage.closeAllInfoWindows();
    d.infoWindow = new google.maps.InfoWindow({
        content: b
    });
    d.infoWindow.open(d.parkerMap, a);
};
ParkItPage.closeAllInfoWindows = function() {
    if (this.infoWindow !== null) {
        this.infoWindow.close();
    }
};

/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/

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

/********************************************************************************************************************************************************/

$(document).ready(function() {
    initializeParkIt();
});

function initializeParkIt() {
    $.ajax({
        url: "/regions/all.json",
        success: function(j) {
            if (typeof(j) === 'string') {
                j = jQuery.parseJSON(j);
            }
            if (typeof(j.parkingRegionList) !== "undefined") {
                ParkItPage.Regions = new ParkItRegions(j.parkingRegionList);
            } else {
                console.error("GetFeature Request API Error: " + j.Error.ErrorDescription);
                console.error("all.json call failed, check Parker API. ");
            }
        }.bind(this),
        error: function(a) {
            console.error(a.statusText);
            return;
        },
        timeout: function() {
            console.warn("GetFeature Request Timeout :-(");
            return;
        }.bind(this)
    });

    var loc = String(window.location);
    var queryStr = loc.split("?");

    if (queryStr[1] && queryStr[1].indexOf("msu") != -1) {
        //MSU page
        ParkItPage.query = true;
    }

    ParkItPage.initialize();
}

function initMap() {
    if (ParkItPage.Regions) {
        createMap();
    } else {
        setTimeout(initMap, 100);
    }
}

load_markers = function(map, async) {
    ParkItPage.Regions.getRegion(map);
    return
}.bind(this);

createdefaultMarker = function(location, title, boxWidth) {
    if (!boxWidth) boxWidth = '200';
    ParkItPage.defaultMarker = new google.maps.Marker({
        position: location,
        icon: "Images/location_marker.png",
        draggable: false,
        map: ParkItPage.parkerMap,
        title: ''
    });

    google.maps.event.addListener(ParkItPage.defaultMarker, 'click', function() {
        ParkItPage.openInfoWindow(title, ParkItPage.defaultMarker);
    });
}.bind(this);

createMap = function() {
    var initialLocation = new google.maps.LatLng(ParkItPage.LAT, ParkItPage.LNG);
    ParkItPage.parkerMap = new google.maps.Map(document.getElementById('map'), {
        center: initialLocation,
        zoom: parseInt(ParkItPage.ZoomLevel)
    });

    // Try HTML5 geolocation.
    if (navigator.geolocation && !ParkItPage.query) {

        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            createdefaultMarker(pos, 'Your current location.');
            ParkItPage.parkerMap.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, ParkItPage.parkerMap.getCenter());
        });
    } else {
        createdefaultMarker(initialLocation, 'Your current location.');
    }

    google.maps.event.addListener(ParkItPage.parkerMap, 'click', function(event) {
        ParkItPage.zoomChange = false;
        return clicked_on_map(event.latLng);
    });
    google.maps.event.addListener(ParkItPage.parkerMap, 'dragend', function() {
        ParkItPage.zoomChange = false;
        ParkItPage.customEvents.dispatch("viewport_change");
        return load_markers(ParkItPage.parkerMap);

    });
    google.maps.event.addListener(ParkItPage.parkerMap, 'zoom_changed', function() {
        if (this.getZoom() < ParkItPage.MinimumZoomLevel) {
            ParkItPage.parkerMap.setZoom(ParkItPage.MinimumZoomLevel);
            return;
        }
        if (this.getZoom() > ParkItPage.MaximumZoomLevel) {
            ParkItPage.parkerMap.setZoom(ParkItPage.MaximumZoomLevel);
            return;
        }
        ParkItPage.zoomChange = true;
        ParkItPage.ZoomLevel = this.getZoom();
        ParkItPage.customEvents.dispatch("viewport_change");
        return load_markers(ParkItPage.parkerMap);
    });
    google.maps.event.addListenerOnce(ParkItPage.parkerMap, 'tilesloaded', function() {
        load_markers(ParkItPage.parkerMap);
    });
    google.maps.event.addDomListener(ParkItPage.parkerMap.getDiv(), 'click', function(e) {
        var t = e.target,
            a = [null, 'Pan left', 'Pan right', 'Pan down', 'Pan up'];

        if (t.attributes !== undefined && t.attributes.length > 1 && a.indexOf(t.attributes[1].value) > 0) {
            ParkItPage.zoomChange = false;
            ParkItPage.customEvents.dispatch("viewport_change");
            generateIframeCode();
            return load_markers(ParkItPage.parkerMap);
        }
    });
    clicked_on_map = function(location) {
        ParkItPage.selectedMarker = null;
        ParkItPage.closeAllInfoWindows();
    };
}.bind(this);
