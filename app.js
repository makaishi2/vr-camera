var express = require('express');
var fs = require('fs');
var cfenv = require('cfenv');
var watson = require('watson-developer-cloud');
var multer  = require('multer');
var os = require('os');
var async = require('async');
var extend = require('extend');
var sprintf = require('sprintf').sprintf;
var TWENTY_SECONDS = 20000;

if (fs.existsSync('./env.js')) {
    Object.assign(process.env, require('./env.js'));
}

var appEnv = cfenv.getAppEnv();
var vr_credentials = appEnv.getServiceCreds('visualrecognition-for-darkvision');
var visualRecognition = new watson.VisualRecognitionV3({
  version_date: '2015-05-19',
  api_key: vr_credentials.api_key
});

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
     var params = { images_file: fs.createReadStream(req.file.path), 'Accept-Language': 'ja' };

    var methods = [];
    params.classifier_ids = ['default', 'food'];
    params.threshold = 0.5;
    methods.push('classify');
//    methods.push('detectFaces');
//    methods.push('recognizeText');

    async.parallel(methods.map(function(method) {
        var fn = visualRecognition[method].bind(visualRecognition, params);
        if (method === 'recognizeText' || method === 'detectFaces') {
          return async.reflect(async.timeout(fn, TWENTY_SECONDS));
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
            // save the classifier_id as part of the response
            if (req.body.classifier_id) {
                combine.value.classifier_ids = req.body.classifier_id;
            }
            combine.value.raw = {};
            methods.map(function(methodName, idx) {
                combine.value.raw[methodName] = results[idx].value;
            });
            console.log('=====ALL=====');  
            console.log(combine.value);
            console.log('=====PART=====');
            var result = "";
            var result1 = combine.value.raw.classify.images[0].classifiers;
 //           console.log(result1);
            result1.forEach(function(val1, index1,ar1){
                var name = val1.name;
                var name_j;
                var list = [];
                if ( name === 'default' ) { name_j = 'デフォルト'; }
                if ( name === 'food' ) { name_j = '食物'; }
                console.log( "name: " + name );
                result = result + "分類器: " + name_j + "\n";
                var result2 = val1.classes;
                result2.forEach(function(val2, index2, ar2){
                    var classname = val2.class;
                    var score = sprintf('%.3f', val2.score);
                    list.push(score + ':' + classname);
//                    console.log(classname + ": " + score);
                });
                console.log('before');
                console.log(list);
                list.sort(function(a, b) {return a < b;});
                console.log('after');
                console.log(list);
                list.forEach(function(val3, index3, ar3) {
                    console.log(val3);
                    result = result + val3 + '\n';
                });
                result = result + '\n';
            });
//            console.log(result);  
            res.header('Content-Type', 'text/plain;charset=utf-8');
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

