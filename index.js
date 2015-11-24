var express = require("express"),
    app = express();
var request = require('request');

app.use(express.static(__dirname));
app.get("/getData", function(req, res) {
    var requestUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + req.query.latitude + ',' + req.query.longitude + '&radius=' + req.query.radius + '&types=parking&key=AIzaSyC0t-qP46fEA1XERGV8YJN1-B9eszVEdRk';
    var options = {
        Host: 'maps.googleapis.com',
        uri: requestUrl,
        method: 'GET',
    };
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            if (typeof(body) == "string") body = JSON.parse(body);
            console.log(body.status);
            if (body.status == 'OK') {
                res.send(body);
            } else {
                res.send(body.status);
            }
        }
    });
});
app.get("/getAvailability", function(req, res) {
    var placeId = {
        status : "ok",
        "placeId": req.query.placeId
    };
    res.send(placeId);
});
app.get("/addPlaceToGoogle", function(req, res) {
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
    request(options, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(newData);
            console.log(typeof(body));
            if (body.status == 'OK') {
                res.send("Added " + req.query.name);;
            } else {
                res.send(" Failed..!!! ");
            }
        }
    });
});
app.get("/deletePlaceToGoogle", function(req, res) {
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
    request(options, function(error, response, body) {
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
app.listen(8080);
