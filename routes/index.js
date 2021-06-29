const express = require('express');
const router = express.Router();
const request = require('request');
const fetch = require('node-fetch');
const mongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const google_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=';
const google_api_key = "AIzaSyAcU_WRH26ojanxF29jOApo0EKuSe4JMN0";

// db Object
let dbo;

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    let credentials = JSON.parse(content);
    let uri = "mongodb+srv://"+credentials.dba_user+":"+credentials.dba_pass+"@cluster0.nzzxb.mongodb.net/parkit?retryWrites=true&w=majority";

    //Mongodb connection using mongodb client : the mangodb service has to be started on the server
    mongoClient.connect(uri, function (err, client) {
        if (err) {
            return console.dir(err);
        }
        dbo = client.db("parkit");
    });
});

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendFile('index.html');
});

/*
 getNearbyPlacesData abstract class for firing request to google place search web service
 recursive request pulling from google places web service (google place ws will support only a maximum of 60 places in increments of 20)
 */
const getGoogleMarkersFetch = async function(lat, lon, rad, token) {
    // Setting URL and headers for request
    let url = token == undefined ? google_url + lat + ',' + lon + '&radius=' + rad + '&types=parking&key=' + google_api_key :
        google_url + lat + ',' + lon + '&radius=' + rad + '&types=parking&key=' + google_api_key + "&pagetoken=" + token

    let response = await fetch(url);
    let content = await response.json();
    // retry till you get the results because google takes time to process the next paginated data, refer https://developers.google.com/maps/documentation/places/web-service/search
    while(content.status == "INVALID_REQUEST"){
        response = await fetch(url);
        content = await response.json();
    }
    // if next page token exists, fetch the next set
    if (content.next_page_token != undefined) {
        let localResults = await getGoogleMarkersFetch(lat, lon, rad, content.next_page_token);

        // create a copy of the result set and return
        return [...content.results, ...localResults];
    } else {
        return content.results;
    }
}

/*
 Route for 'GET' google near by places data
 Query Param: latitude
 Query Param: longitude
 Query Param: radius
 */
router.get("/getData", async function (req, res) {
    let result = await getGoogleMarkersFetch(req.query.latitude, req.query.longitude, req.query.radius);
    console.log("Total markers fetched -- > " + result.length);
    res.send({"results": result, status: "OK"});
});

/*
 Route for fetching availability status for a particular placeID
 Query Param: placeId - google place id
 */
router.get("/getAvailability", function (req, res) {
    var placeId = {
        status: "ok",
        "placeId": req.query.placeId
    };
    var availCollection = dbo.collection('availability');
    availCollection.findOne({
        placeId: req.query.placeId
    }, function (err, item) {
        if (item) placeId.item = item;
        else placeId.status = "Not available";
        res.send(placeId);
    });
});

/*
 Route for fetching all placeId from availability collection
 */
router.get("/getAllPlaceIds", function (req, res) {
    var availCollection = dbo.collection('availability');
    availCollection.distinct("placeId", function (err, items) {
        res.send(items);
    });
});

/*
 Route for fetching all objects from availability collection
 */
router.get("/getAllAvailability", function (req, res) {
    var availCollection = dbo.collection('availability');
    availCollection.find().toArray(function (err, result) {
        res.send(result);
    });
});

/*
 Route for fetching all objects from availability collection
 */
router.get("/removePlace", function (req, res) {
    var availCollection = dbo.collection('availability');
    availCollection.remove({placeId: req.query.placeId});
    res.send("done");
});

/*
 Route for fetching availability status for a particular placeID
 Query Param: placeId - google place id (parking lot)
 Query Param: avail - available spaces
 Query Param: total - total spaces
 */
router.get("/addAvailability", function (req, res) {
    var newData = {
        "placeId": req.query.placeId,
        parkmap: {},
        "avail": parseInt(req.query.avail),
        "total": parseInt(req.query.total)
    };
    var availCollection = dbo.collection('availability');
    availCollection.insert(newData, {
        w: 1
    }, function (err, result) {
        var returndata = {
            status: "ok",
            "error": err,
            "result": result
        };
        res.send(returndata);
    });
});

/*
 Route for inserting parking slot status for a particular placeID
 Query Param: parks - string separated by ',' ,which defines the name of the slot
 */
router.get("/insertParkers", function (req, res) {
    var availCollection = dbo.collection('availability');
    var parks = req.query.parks.split(",");
    var pStatus = req.query.pStatus.split(",");
    var pMap = {
        parkmap: {}
    };
    for (var i = 0; i < parks.length; i++) {
        pMap.parkmap[parks[i]] = pStatus[i];
    }
    pMap = flattenObject(pMap);
    availCollection.update({
        placeId: req.query.placeId
    }, {
        $set: pMap
    });
    res.send("Update fired : " + req.query.placeId);
});

/*
 * Flatten Object @gdibble: Inspired by https://gist.github.com/penguinboy/762197
 *   input:  { 'a':{ 'b':{ 'b2':2 }, 'c':{ 'c2':2, 'c3':3 } } }
 *   output: { 'a.b.b2':2, 'a.c.c2':2, 'a.c.c3':3 }
 */
var flattenObject = function (ob) {
    var toReturn = {};
    var flatObject;
    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) {
            continue;
        }
        if ((typeof ob[i]) === 'object') {
            flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) {
                    continue;
                }
                toReturn[i + (!!isNaN(x) ? '.' + x : '')] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

/*
 Route for updating availability status for a particular placeID
 Query Param: placeId - google place id (parking lot)
 Query Param: avail - current available spaces
 */
router.get("/updateAvailability", function (req, res) {
    var availCollection = dbo.collection('availability');
    availCollection.update({
        placeId: req.query.placeId
    }, {
        $set: {
            avail: parseInt(req.query.avail)
        }
    });
    res.send("Update fired : " + req.query.placeId + " with avail:" + parseInt(req.query.avail));
});

/*
 Route for adding google place - custom parking lot creation
 Query Param: latitude
 Query Param: longitude
 Query Param: name
 Query Param: address
 */
router.get("/addPlaceToGoogle", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/add/json?key=' + google_api_key;
    var type = "parking";
    if (req.query.type) {
        type = req.query.type;
    }
    var newData = {
        "location": {
            "lat": parseFloat(req.query.latitude),
            "lng": parseFloat(req.query.longitude)
        },
        "accuracy": 50,
        "name": req.query.name,
        "address": req.query.address,
        "types": [type]
    };
    var options = {
        host: 'maps.googleapis.com',
        uri: requestUrl,
        method: 'POST',
        json: newData
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(newData);
            console.log(typeof(body));
            if (body.status == 'OK') {
                res.send("Added " + req.query.name + "\n PlaceID :" + body.place_id);
            } else {
                res.send(" Failed..!!! ");
            }
        }
    });
});

/*
 Route for deleting google place - custom parking lot created places only
 Query Param: placeId
 */
router.get("/deletePlaceToGoogle", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/delete/json?key=' + google_api_key;
    var newData = {
        "place_id": req.query.placeId
    };
    var options = {
        Host: 'maps.googleapis.com',
        uri: requestUrl,
        method: 'POST',
        json: newData
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the shortened url.
            console.log(typeof(body));
            if (body.status == 'OK') {
                res.send(" Deleted : " + req.query.placeId);
            } else {
                res.send(" Failed..!!! " + body["status"]);
            }
        }
    });
});

/*
 Route for fetching place details - parking lot details
 Query Param: placeId
 */
router.get("/getPlaceDetails", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.placeId + '&key=' + google_api_key;
    var options = {
        Host: 'maps.googleapis.com',
        uri: requestUrl,
        method: 'GET',
    };
    request(options, function (error, response, body) {
        var body = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            if (body.status == 'OK') {
                res.send(body);
            } else {
                res.send(body["status"]);
            }
        }
    });
});

module.exports = router;
