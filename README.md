# Red Hat Mobile Lab Cloud App

We'll take a new default MBaaS, connect to google geocode API to swap city and start
input for latitude and longitude, which we will use to call the dark sky weather Service
and inquire about the current temperature.

### Start with the default blank MBaaS template AKA New MBaaS Service.

* In application .js swap the /hello route for a /weather-service route.

### We'll tell Express to send requests to /weather-service to our index.js file in lib.
(If no file is specified for the folder, node defaults to index.js).

To do this we'll change this
```Javascript
app.use('/hello', require('./lib/hello.js')());
```
To this
```Javascript
app.use('/weather-service', require('./lib'));
```
* Rename hello.js to index.js and remove all contents
* We want to handle temperature requests to /weather-service/temperature/:city/:state
so we'll need to tell express how to get those requests to our function(s) that
will handle them.  We'll need express, bodyParser, a good opensource logger, the request module,
and we also need to instantiate the Express router and export our routes.  We'll go ahead
and put variables in for our API Keys too.
```Javascript
var darkSkyKey = process.env.DARK_SKY_KEY
  , googleGeoCodeKey = process.env.GOOGLE_GEOCODE_KEY
  , express = require('express')
  , bodyParser = require('body-parser')
  , log = require('fhlog').get('temperature')
  , request = require('request')
  , route = module.exports = new express.Router();
```

* Let's go ahead and put our API Keys in our Gruntfile.js in the env.local section
```
DARK_SKY_KEY: 'Your Dark Sky Key Here',
GOOGLE_GEOCODE_KEY: 'Your Google Geocode Key Here',
```
* We should probably put in a logger just in case someone neglected to set up their
API Keys

```Javascript
log.d('DarkSkyKey -> %s', darkSkyKey);
log.d('googleGeoCodeKey -> %s', googleGeoCodeKey);
```

* We need to use bodyParser to parse incoming requests and we need to tell Express
how to route requests to /weather-service/temperature/:city/:state, we'll send them to
a function called doGetTemp for now.
```Javascript
route.use(bodyParser.json());

route.get('/temperature/:city/:state', doGetTemp);
```

* Before we start writting doGetTemp, let's create a function to call the google geocoding API and exchange our city and state data for latitude and longitude.  We'll use the request module for this.

```Javascript
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
```

* Now that we have latitude and longitude data, we can ask the Dark Sky Weather Service for the current temperature.

```Javascript
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
```

* Now that our two main functions are complete, let's bring everything together in our doGetTemp function.

```Javascript
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
```

* We need to alter our package.json file to include the fhlog npm module
```
"fhlog": "^0.12.1"
```
* Install the node modules
```
npm i
```
* Before we start the MBaaS, let's change some configuration values in Gruntfile.js that will allow us to run this service simultaneously with our Cloud app
* In the watch section, let's change the livereload values from true to 30000.  This will allow livereload to do it's thing without interference.  (It restarts your node application when it determines a file has been changed, meaning you won't have to Ctrl + C and grunt serve every time you change your code).
```
watch: {
  js: {
    files: ['gruntfile.js', 'application.js', 'lib/**/*.js', 'test/**/*.js'],
    options: {
      livereload: 30000
    }
  },
  html: {
    files: ['public/views/**', 'app/views/**'],
    options: {
      livereload: 300000
    }
  }
},
```

* We'll also change the port grunt serves our MBaaS on so we don't conflict the the Cloud app, let's add the following line in Gruntfile.js in the env.local section
```
FH_PORT: 8002,
```

* Start the MBaaS
```
grunt serve
```
* Check that all is good by typing the following into your browser.
http://127.0.0.1:8002/weather-service/temperature/Richmond/VA

### Now let's head back to our Cloud App and get it working with our new MBaaS.

### Temperature MBaaS API

### /weather-service/temperature/:city/:state [/weather-service/temperature/:city/:state]

Temperature endpoint
## /weather-service/temperature/:city/:state [GET]

+ Request (application/json)
    + Body
            {}
+ Response 200 (application/json)
    + Body
            {}
