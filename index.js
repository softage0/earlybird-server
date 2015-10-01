// express
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var mongodbUrl = process.env.MONGOLAB_URI;
var assert = require('assert');
var cool = require('cool-ascii-faces');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

MongoClient.connect(mongodbUrl, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server.");
    db.close();
});


app.get('/', function(request, response) {
    response.send('Early Bird!! ' + cool());
});

app.post('/login', function (req, res) {
    console.log("Got response: " + res.statusCode);

    MongoClient.connect(mongodbUrl, function(err, db) {
        assert.equal(null, err);
        req.body._id = ObjectId;
        console.log(req.body);
        insertDocument(db, 'account', req.body,
            function() {
                findDocument(db, 'alarmList', { 'member.facebookId': req.body.facebookId }, function(err, doc) {
                    assert.equal(null, err);

                    if (!err) {
                        console.log(doc);
                        res.json(doc);
                    }

                    db.close();
                });
            });
    });
});

app.post('/postAlarm', function (req, res) {
    console.log("Got response: " + res.statusCode);

    MongoClient.connect(mongodbUrl, function(err, db) {
        assert.equal(null, err);
        req.body._id = ObjectId;
        console.log(req.body);

        insertDocument(db, 'alarmList', req.body,
            function() {
                res.send('Success: alarmList added');
                db.close();
            });
    });
});

app.get('/alarmInfo', function (req, res) {
    MongoClient.connect(mongodbUrl, function(err, db) {
        assert.equal(null, err);
        var queries = [];
        if (req.query.code) queries.push( { "code": req.query.code });
        if (req.query.uid) queries.push( { "uid": req.query.uid });

        findDocument(db, 'alarmList', queries && { $and: queries }, function(err, doc) {
            assert.equal(null, err);
            db.close();

            if (!err) {
                console.log(doc);
                res.json(doc);
            }
        });
    });
});

app.post('/alarmInfo', function (req, res) {
    console.log("Got response: " + res.statusCode);

    MongoClient.connect(mongodbUrl, function(err, db) {
        assert.equal(null, err);
        req.body._id = ObjectId;
        console.log(req.body);
        insertDocument(db, 'alarmInfo', req.body,
            function() {
                res.send('Success: alarmInfo');
                db.close();
            });
    });
});

app.get('/db', function (request, response) {
    MongoClient.connect(mongodbUrl, function(err, db) {
        assert.equal(null, err);
        findDocument(db, 'alarmInfo', null, function(err, doc) {
            assert.equal(null, err);
            db.close();

            if (!err) {
                response.render('pages/db', {results: doc} );
            }
        });
    });
});

app.get('/heroku', function(request, response) {
    response.render('pages/index');
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


var insertDocument = function(db, collection, data, callback) {
    db.collection(collection).insertOne(data, function(err, result) {
        assert.equal(err, null);
        console.log("Inserted a document into the " + collection + " collection.");
        callback(result);
    });
};

var findDocument = function(db, collection, query, callback) {
    var cursor = db.collection(collection).find(query);
    cursor.toArray(function(err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            callback(err, doc);
        } else {
            callback(err);
        }
    });
};
