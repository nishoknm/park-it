var express = require("express");
var router = express.Router();


//Status producer object
var StatusProducer = require('./StatusProducer.js').StatusProducer;
var statusProducer = new StatusProducer();

//handle get request for retrieving parking status
router.get('/parking-status', function (req, res) {
    //produce fake status using StatusProducer class
    var col = [19, 13, 13, 13, 13, 19];

    var status = {};
    for (var i = 0; i < col.length; i++) {
        status[i] = statusProducer.getStatus(col[i]);
    }

    res.send(status);
});

//handle get request for retrieving
// inner parking map structure
router.get('/parking-inner-map', function (req, res) {
    var map_info = {
        num_spots: 90
    };
    res.send(map_info);
});

module.exports = router;



