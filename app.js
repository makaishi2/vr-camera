var express = require('express');
var fs = require('fs');
var cfenv = require('cfenv');
var watson = require('watson-developer-cloud');
var multer  = require('multer');
var os = require('os');
var async = require('async');
var extend = require('extend');
var API_TIMEOUT = 40000;  // msec

if (fs.existsSync('./env.js')) {
    Object.assign(process.env, require('./env.js'));
}

var appEnv = cfenv.getAppEnv();
var vr_credentials = appEnv.getServiceCreds('/visualrecognition-/');
var visualRecognition = new watson.VisualRecognitionV3({
    version_date: '2015-05-19',
    api_key: vr_credentials.api_key
});

var classifier_id;
if (process.env.classifier_id) {
    classifier_id = process.env.classifier_id;
    console.log( "classifier_id: " + classifier_id);
}

var app = express();
app.use(express.static(__dirname + '/public'));
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// Setup the upload mechanism
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, os.tmpdir());
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
  
var upload = multer({
    storage: storage
});


app.post('/send', upload.single('image'), function(req, res) {
    console.log( req.file );
    console.log( req.body );
     
    var vr_type = req.body.vr_type;
    if ( !vr_type ) {
        res.status(400).send('parameter error!');
    }
    
    console.log( vr_type );
    var params = { images_file: fs.createReadStream(req.file.path), 'Accept-Language': 'ja' };
    params.threshold = 0.5;

    var methods = [];
    var classifier_ids = [];

    if (vr_type.indexOf('1') != -1) {
        console.log("type 1");
        classifier_ids.push('default');
    }
    if (vr_type.indexOf('2') != -1) {
        console.log("type 2");
        classifier_ids.push('food');
    }
    if (vr_type.indexOf('3') != -1 && classifier_id) {
        console.log("type 3");
        classifier_ids.push(classifier_id);
    }
    if ( classifier_ids.length ) {
        methods.push('classify');
    }
    if (vr_type.indexOf('4') != -1) {
        console.log("type 4");
        methods.push('detectFaces');
    }
    if (vr_type.indexOf('5') != -1) {
        console.log("type 5");
        methods.push('recognizeText');
    }
    params.classifier_ids = classifier_ids;

    if ( params.classifier_ids.length ) {
        console.log(params.classifier_ids);
    }
    console.log(methods);

    async.parallel(methods.map(function(method) {
        var fn = visualRecognition[method].bind(visualRecognition, params);
        if (method === 'recognizeText' || method === 'detectFaces') {
          return async.reflect(async.timeout(fn, API_TIMEOUT));
        } else {
          return async.reflect(fn);
        }
    }), function(err, results) {
    // delete the recognized file
        deleteUploadedFile(params.images_file);

        if (err) {
            console.log(err);
            return res.status(err.code || 500).json(err);
        }
    // combine the results
        var combine = results.map(function(result) {
            if (result.value && result.value.length) {
        // value is an array of arguments passed to the callback (excluding the error).
        // In this case, it's the result and then the request object.
        // We only want the result.
                result.value = result.value[0];
            }
          return result;
        }).reduce(function(prev, cur) {
            return extend(true, prev, cur);
        });
        if (combine.value) {
            var result = combine.value.images[0];
            console.log(result);
            res.send(result);
        } else {
            res.status(400).json(combine.error);
        }
    });
});

function deleteUploadedFile(readStream) {
    fs.unlink(readStream.path, function(e) {
        if (e) {
            console.log('error deleting %s: %s', readStream.path, e);
        }
    });
}

