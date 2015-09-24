'use strict';
var darkSkyKey = process.env.DARK_SKY_KEY
  , googleGeoCodeKey = process.env.GOOGLE_GEOCODE_KEY
  , express = require('express')
  , bodyParser = require('body-parser')
  , log = require('fhlog').get('temperature')
  , request = require('request')
  , route = module.exports = new express.Router();

log.d('DarkSkyKey -> %s', darkSkyKey);
log.d('googleGeoCodeKey -> %s', googleGeoCodeKey);
route.use(bodyParser.json());

route.get('/temperature/:city/:state', doGetTemp);

function doGetLatLngLikeService(city, state, callback) {
  var url = 'https://maps.googleapis.com/maps/api/geocode/json?'
  + 'address=' + city + ',+' + state +'&key=' + googleGeoCodeKey;
  request(url, function(err, response, body) {
    if(err) {
      return callback(err);
    }
    var lat = '';
    var lng = '';
    try {
      lat = JSON.parse(body).results[0].geometry.location.lat;
      lng = JSON.parse(body).results[0].geometry.location.lng;
    }
    catch(e) {
      return callback(e);
    }
    log.d('lat %s lng %s', lat, lng);
    callback(null, {lat: lat, lng: lng});
  });
}

function doGetTemperatureLikeService(params, callback) {
  var url = 'https://api.forecast.io/forecast/' + darkSkyKey + '/' + params.lat + ',' + params.lng;
  request(url, function(err, response, body) {
    if(err) {
      return callback(err);
    }
    var temperature = '';
    try {
      temperature = JSON.parse(body).currently.temperature;
    }
    catch(e) {
      return callback(e);
    }
    log.d('temperature %s', temperature);
    callback(null, temperature);
  });
}

function doGetTemp(req, res) {
  if(!req.params.city || !req.params.state) {
    res.json(400, {
      message: 'Please provide city and state input.'
    });
  }
  else {
    doGetLatLngLikeService(req.params.city, req.params.state, function(err, location) {
      if(err) {
        res.json(400, {
          message: 'Error contacting Geocoding Service.'
        })
      }
      else {
        doGetTemperatureLikeService(location, function(err, temperature) {
          if(err) {
            res.json(400, {
              message: 'Error contacting Weather Service.'
            })
          }
          else {
            res.json({temperature:temperature});
          }
        })
      }
    })
  }
}
