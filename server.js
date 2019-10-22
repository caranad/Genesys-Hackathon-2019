'use strict';

var express = require('express');
const request = require('request');
var multer = require('multer');
var path = require('path');
var https = require('https');
var fse = require('fse');
var ExifImage = require('exif').ExifImage;
var Jimp = require('jimp'); 
var piexif = require('piexifjs');
/*
const send = require('gmail-send')({
    user: 'farmerbob595@gmail.com',
    pass: 'bobfarm123',
    to:   'christopher.aranadi@gmail.com;rydsouza82@gmail.com;samual.s.ip@gmail.com'
});
*/


var privateKey  = fse.readFileSync('sslcert/key.pem', 'utf8');
var certificate = fse.readFileSync('sslcert/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};


const TYPE = `binary`

// start express module
var app = express();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file, cb) {
        // console.log(file);
        //cb(null, file.originalname);
        cb(null, "image.jpg");
    }
});
var upload = multer({ storage: storage })

app.use(express.static(path.join(__dirname, 'public')));
app.use(upload.single('userfile'));



app.post('/upload', function (req, res) {
    
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var country = req.body.country;
    var weather = req.body.weather;
    var temperature = parseInt(req.body.temperature);
    //var userfile = req.file;
    //console.log(userfile);

    new ExifImage({ image : './public/uploads/image.jpg' }, async function (error, exifData) {
        
        if (error) {
            console.log('Error: ' + error.message);
        }

        // get orientation
        var orientation = exifData.image.Orientation;
        console.log("orientation", orientation);
   
        console.log("about to remove metadata");
        // remove exif metadata
        if (orientation==1 || orientation==3 || orientation==6 || orientation==8) {
            const newData = piexif.remove(
                fse.readFileSync('./public/uploads/image.jpg').toString(TYPE)
            )
            fse.writeFileSync('./public/uploads/image.jpg', new Buffer(newData, TYPE))
        }

        console.log("about to resize and rotate");
        // rotate image
        const image = await Jimp.read('./public/uploads/image.jpg'); 
        if (orientation == 1) {
            await image.resize(400, Jimp.AUTO).rotate(0).writeAsync('./public/uploads/image.jpg'); 
        } else if (orientation == 3) {
            await image.resize(400, Jimp.AUTO).rotate(180).writeAsync('./public/uploads/image.jpg');
        } else if (orientation == 6) {
            await image.resize(400, Jimp.AUTO).rotate(270).writeAsync('./public/uploads/image.jpg');
        } else if (orientation == 8) {
            await image.resize(400, Jimp.AUTO).rotate(90).writeAsync('./public/uploads/image.jpg');
        }

        // originals
        //1: 'rotate(0deg)',
        //3: 'rotate(180deg)',
        //6: 'rotate(90deg)',
        //8: 'rotate(270deg)'

        getImageDetails(function(img_data) {

            var env_data = {
                "lat" : latitude,
                "long" : longitude,
                "country" : country,
                "city" : "Toronto",
                "weather" : weather,
                "extreme_weather" : false,
                "temperature" : temperature,
                "img_data" : img_data
            };
    
            askGenesys(env_data, function(suggestion, confidence) {
                var full_data = {
                    env_data : env_data,
                    suggestion : suggestion,
                    confidence : confidence
                };
                console.log(JSON.stringify(full_data));

                fse.writeFileSync('./public/uploads/data.json', JSON.stringify(full_data));
    
                var html =  "<div style=\"background-color:rgb(210, 210, 210);\" align=\"center\">" +
                                "<div style=\"background-color:white;display:inline-block;margin:10px;padding:10px;\" align=\"left\">" +
                                    "<h1>Suggestion: " + full_data.suggestion + "</h1>" +
                                    "<div>Confidence: " + (full_data.confidence*100) + "%</div>" + 
                                    "<div>Latitude: " + env_data.lat + "</div>"+
                                    "<div>Longitude: " + env_data.long + "</div>"+
                                    "<div>Country: " + env_data.country + "</div>"+
                                    "<div>City: " + env_data.city + "</div>"+
                                    "<div>Weather: " + env_data.weather + "</div>"+
                                    "<div>Temperature: " + env_data.temperature + "°C</div>"+
                                    "<div>Image Color: <span style=\"width:10px;height:10px;background-color:" + env_data.img_data.color + "\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>" +
                                    "<div>Image Tags: " + env_data.img_data.tags.join(", ") + "</div>" +
                                "</div>" +
                            "</div>";
                //console.log(html);

                /*
                send({
                    subject: 'Greetings from Prince Farming',
                    html: html,
                    files : ['./public/uploads/image.jpg']
                }, (error, result, fullResult) => {
                    if (error) {
                        console.error(error);
                    } 
                    console.log("finished sending email");
                    res.end(JSON.stringify({}));
                });
                */

                console.log("broadcasted to everyone");
                io.emit('notification', { html: html });

                res.end(JSON.stringify({}));
                console.log("finished");
            });
        });

        console.log("Image Processing Completed"); 
    });
});




function askGenesys(env_data, callback) {
    var options = { 
        method: 'POST',
        url: 'https://api.genesysappliedresearch.com/v2/knowledge/generatetoken',
        headers: { secretkey: '96a8e5ad-06a6-4ed7-87ec-8e1d0e6c8820', organizationid: 'a078486f-4ed7-4814-af1a-11718c78ea21' } 
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
            return askGenesysQuestion('', env_data, callback);
        }
        var body = JSON.parse(body);
        
        var token = body.token;
        //console.log(body);
        askGenesysQuestion(token, env_data, callback);
    });
}

function colorDistance(v1, v2) {
    var i, d = 0;

    for (i = 0; i < v1.length; i++) {
        d += (v1[i] - v2[i])*(v1[i] - v2[i]);
    }

    return Math.sqrt(d);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function deltaE(rgbA, rgbB) {
    let labA = rgb2lab(rgbA);
    let labB = rgb2lab(rgbB);
    let deltaL = labA[0] - labB[0];
    let deltaA = labA[1] - labB[1];
    let deltaB = labA[2] - labB[2];
    let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
    let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
    let deltaC = c1 - c2;
    let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
    deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
    let sc = 1.0 + 0.045 * c1;
    let sh = 1.0 + 0.015 * c1;
    let deltaLKlsl = deltaL / (1.0);
    let deltaCkcsc = deltaC / (sc);
    let deltaHkhsh = deltaH / (sh);
    let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
    return i < 0 ? 0 : Math.sqrt(i);
  }
  
  function rgb2lab(rgb){
    let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255, x, y, z;
    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
    return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
  }

function askGenesysQuestion(token, env_data, callback) {

    // transformation
    if (env_data.temperature < 20) { var temp = 'cold'; }
    //else if (env_data.temperature < 20) { var temp = 'mild'; }
    else { var temp = 'hot'; }

    // no rain, mist, clear, rain, partly cloudy
    if (env_data.weather.indexOf("clear sky") !== -1) { var weather = 'no rain'; }
    else if (env_data.weather.indexOf("few clouds") !== -1) { var weather = 'no rain'; }
    else if (env_data.weather.indexOf("scattered clouds") !== -1) { var weather = 'no rain'; }
    else if (env_data.weather.indexOf("broken clouds") !== -1) { var weather = 'no rain'; }
    else if (env_data.weather.indexOf("shower rain") !== -1) { var weather = 'rain'; }
    else if (env_data.weather.indexOf("light rain") !== -1) { var weather = 'rain'; }
    else if (env_data.weather.indexOf("rain") !== -1) { var weather = 'rain'; }
    else if (env_data.weather.indexOf("thunderstorm") !== -1) { var weather = 'rain'; }
    else if (env_data.weather.indexOf("snow") !== -1) { var weather = 'rain'; }
    else if (env_data.weather.indexOf("mist") !== -1) { var weather = 'no rain'; }
    else if (env_data.weather.indexOf("sunny") !== -1) { var weather = 'no rain'; }
    else { var weather = ""; }

    var rgb = hexToRgb(env_data.img_data.color);
    var cd_green = deltaE([rgb.r, rgb.g, rgb.b], [69, 96, 39]); // green
    var cd_yellow = deltaE([rgb.r, rgb.g, rgb.b], [255, 208, 0]); // yellow
    var cd_brown = deltaE([rgb.r, rgb.g, rgb.b], [82, 40, 0]); // brown
    var d = [{c:'green',v:cd_green}, {c:'yellow',v:cd_yellow}, {c:'brown',v:cd_brown}];
    //console.log(d);
    d = d.sort(function(a,b) {
        return a.v-b.v;
    });
    //console.log(d);
    var color = d[0].c;

    var pests = env_data.img_data.tags.filter(function(x) {
        return ["insect", "bug", "bee", "wasp", "ladybug", "ant", "beetle", "fly", "butterfly", "caterpillar", "centipede", "moth", "cocoon", "larva", "larvae", "worm", "locust"].indexOf(x) !== -1;
    }).length > 0 ? "yes" : "no";

    var QUES = /*"Location: " + env_data.city + "; */"Color: " + color + "; Pests: " + pests + "; weather forecast: " + weather + "; temperature: " + temp;// + "; extreme forecast: no";
    //QUES = "Location: Toronto; Color: green; Pests: yes; weather forecast: no rain; temperature forecast: hot; extreme forecast: no";
    console.log(QUES);


    // ask genesys
    var options = { method: 'POST',
      url: 'https://api.genesysappliedresearch.com/v2/knowledge/knowledgebases/eec397dd-1e93-4737-83f0-0075f67d8f5f/search',
      headers: 
       { token: token,
         organizationid: 'a078486f-4ed7-4814-af1a-11718c78ea21',
         'Content-Type': 'application/json' },
      body: 
       { 
        query: QUES,
       //query: "Location: Toronto; Color: green; Pests: no; weather forecast: rain; temperature: mild; extreme forecast: no",
       //query2: "Location: Toronto; Color: green; Pests: yes; weather forecast: rain; temperature forecast: hot; extreme forecast: yes",
       //query3: "Location: Toronto; Color: yellow; Pests: yes; weather forecast: rain; temperature forecast: cold; extreme forecast: yes",  
         pageSize: 5,
         pageNumber: 1,
         sortOrder: 'string',
         sortBy: 'string',
         languageCode: 'en-US',
         documentType: 'Faq' },
      json: true };
    
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
            return callback("Keep doing what you are doing.", 0.3);
        }
    
        //console.log(JSON.stringify(body,null,4));

        var results = body.results.filter(function(x) {
            return (pests === "yes" || (pests === "no" && x.faq.question.indexOf("Pests: yes;") === -1)) && x.confidence > 0.1;
        });
        if (results.length > 0) {
            var result = results[0];
            callback(result.faq.answer, result.confidence);
        } else {
            callback("Keep doing what you are doing.", 0.3);
        }
    });
}

function getImageDetails(callback) {

    var imageToUSe = fse.readFileSync('./public/uploads/image.jpg');

    var subscriptionKey = "38952973ab824afe8673284add426299";
    var endpoint = "https://westcentralus.api.cognitive.microsoft.com/"
    var uriBase = endpoint + 'vision/v2.1/analyze';

    // Request parameters.
    var params = {
        'visualFeatures': 'Categories,Description,Color,Brands,Faces,Objects,Tags',
        'details': '',
        'language': 'en'
    };
    
    var options = {
        uri: uriBase,
        qs: params,
        body:imageToUSe,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key' : subscriptionKey
        }
    };
    
    request.post(options, (error, response, body) => {
        if (error) {
            console.log('Error: ', error);
            return callback({color : '#008000', tags : ['plant']});
        }

        var body = JSON.parse(body);
        var color = body.color.accentColor;
        var desc_tags = body.description.tags;
        var tags = body.tags.map(function(x) {return x.name;});
        
        var Obj = {};
        desc_tags.map(x => {Obj[x] = true; });
        tags.map(x => {Obj[x] = true; });

        var t = Object.keys(Obj).sort();

        callback({
            color : "#" + color,
            tags : t
        });
    });
}

var httpsServer = https.createServer(credentials, app);

var io = require('socket.io')(httpsServer);

httpsServer.listen(process.env.PORT || 3000, function () {
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;

    console.log('Prince Farming started at https://%s:%s', host, port);
});

/*
const Clarifai = require('clarifai');
const app = new Clarifai.App({
    apiKey: 'f9c4e799879b4ea18641017d1a8a6feb'
});

app.models.predict(Clarifai.GENERAL_MODEL, 'https://res.cloudinary.com/patch-gardens/image/upload/c_fill,f_auto,h_840,q_auto:good,w_840/v1568385956/qee7f4jxsabwphslmjfz.jpg')
.then(response => {
  console.log(JSON.stringify(response, null, 4));
})
.catch(err => {
  console.log(err);
});
*/
