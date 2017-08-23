/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const express = require('express');
const fs = require('fs');
const multer  = require('multer');
const os = require('os');
const async = require('async');
const extend = require('extend');
const dotenv = require('dotenv');
const VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
const API_TIMEOUT = 40000;  // 40 sec

// 構成情報の取得
if (fs.existsSync('local.env')) {
  console.log('構成情報をlocal.envから取得します');
  require('dotenv').config({ path: 'local.env' });
} else {
  console.log('環境変数から構成情報を取得します');
}

var api_key = process.env.API_KEY;
var classifier_id = process.env.CLASSIFIER_ID;

var methods;
var classifier_ids;

var visualRecognition = new VisualRecognitionV3({
    version_date: '2015-05-19',
    api_key: api_key
});

var app = express();
app.use(express.static(__dirname + '/public'));

// VCAP_APP_PORTが設定されている場合はこのポートでlistenする (Bluemixのお作法)
var port = process.env.VCAP_APP_PORT || 6010;
app.listen(port, function() {
  // eslint-disable-next-line
  console.log('Server running on port: %d', port);
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
    
// set methods and calssifier_ids
    console.log( vr_type );
    methods = [];
    classifier_ids = [];
    set_methods(vr_type);
    if ( classifier_ids.length ) { console.log(classifier_ids); }
    console.log(methods);

// set vr params
    var params = { 
        images_file: fs.createReadStream(req.file.path), 
        'Accept-Language': 'ja',
        threshold: 0.5,
        classifier_ids: classifier_ids
    };

// call vr api's
    async.parallel(methods.map(function(method) {
        var fn = visualRecognition[method].bind(visualRecognition, params);
        return async.reflect(async.timeout(fn, API_TIMEOUT));
    }), function(err, results) {
        deleteUploadedFile(params.images_file);
        if (err) {
            console.log(err);
            return res.status(err.code || 500).json(err);
        }
    // combine the results
        var combine = results.map(function(result) {
            if (result.value && result.value.length) {
                result.value = result.value[0];
            }
            return result;
        }).reduce(function(prev, cur) {
            return extend(true, prev, cur);
        });
    // return VR result       
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

// set methods and classifier_id's
function set_methods(vr_type) {
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
}
