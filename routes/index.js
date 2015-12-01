var express = require('express');
var router = express.Router();
var request = require('request');
var mootools = require("mootools");
var mongoClient = require('mongodb').MongoClient;

//db Object
var dbo;

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendFile('index.html');
});

mongoClient.connect("mongodb://localhost:27017/parkit", function (err, db) {
    if (err) {
        return console.dir(err);
    }
    dbo = db;
});

var getDataRecursive = new Class({
    Implements: [Chain, Events, Options],
    options: {
        results: []
    },
    initialize: function (lat, lon, rad, res) {
        this.requestUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + lon + '&radius=' + rad + '&types=parking&key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
        this.url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + lon + '&radius=' + rad + '&types=parking&key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
        this.res = res;
    },
    getResults: function () {
        return this.options.results;
    },
    getData: function () {
        console.log('fetching... ' + this.requestUrl);
        request(this.requestUrl, this.callback.bind(this));
    },
    callback: function (error, response, body) {
        var body = JSON.parse(body),
            results = body.results;

        if (error || body.error) {
            this.dataCallback(error || body.error);
        } else {
            this.getResults().push(...results);
            if (body.next_page_token) {
                this.requestUrl = this.url + "&pagetoken=" + body.next_page_token;
                console.log(body.next_page_token);
                setTimeout(this.getData.bind(this), 2000);
            } else {
                body.results = this.getResults();
                this.dataCallback(null, body);
            }
        }
    },
    dataCallback: function (err, body) {
        if (err) this.res.send(err);
        else {
            this.res.send(body);
        }
    }
});

router.get("/getData", function (req, res) {
    var getDataRecursiveObj = new getDataRecursive(req.query.latitude, req.query.longitude, req.query.radius, res);
    getDataRecursiveObj.getData();
});
router.get("/getAvailability", function (req, res) {
    var placeId = {
        status: "ok",
        "placeId": req.query.placeId
    };
    var availCollection = dbo.collection('availability');
    availCollection.findOne({placeId: req.query.placeId}, function (err, item) {
        if (item)placeId.item = item;
        else placeId.status = "Not available";
        res.send(placeId);
    });
});
router.get("/addAvailability", function (req, res) {
    var newData = {
        "placeId": req.query.placeId,
        parkmap: {p1: 1, p2: 1, p2: 0},
        "avail": parseInt(req.query.avail),
        "total": parseInt(req.query.total)
    };
    var availCollection = dbo.collection('availability');
    availCollection.insert(newData, {w: 1}, function (err, result) {
        var returndata = {status: "ok", "error": err, "result": result};
        res.send(returndata);
    });
});
router.get("/updateAvailability", function (req, res) {
    var availCollection = dbo.collection('availability');
    availCollection.update(
        {placeId: req.query.placeId},
        {
            $set: {
                avail: parseInt(req.query.avail)
            }
        }
    );
    res.send("Update fired : " + req.query.placeId + " with avail:" + parseInt(req.query.avail));
});
router.get("/addPlaceToGoogle", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/add/json?key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
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
                ;
            } else {
                res.send(" Failed..!!! ");
            }
        }
    });
});
router.get("/deletePlaceToGoogle", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/delete/json?key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
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

router.get("/getPlaceDetails", function (req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + req.query.placeId + '&key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
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
