var express = require('express');

var app = express();

const bodyParser = require('body-parser');

var cors = require('cors')

var randomstring = require("randomstring");


const { MongoClient } = require('mongodb');

const bcrypt = require('bcrypt');

require('dotenv').config()

const uri = "mongodb+srv://userOne:userOne@cluster0-4ntyu.mongodb.net/<dbname>?retryWrites=true&w=majority";

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASS
    }
});



app.use(cors());

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.status(200).send('/register to register. /login to login. /reset to reset password');
})

var server = app.listen(process.env.PORT || 8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
})

app.post("/register", function (req, res) {
    var email = req.body.email;
    var pass = req.body.pass;

    console.log(req.body);

    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("pordDbOne");

        dbObject.collection("userCollOne").find({ email: email }).toArray(function (err, data) {
            if (err) throw err;
            if (data.length > 0) {
                console.log("Present");
                res.status(400).send("Email already Registered !");
            }
            else {
                console.log("Not Present");
                bcrypt.hash(pass, 10, function (err, hash) {
                    let secretString = randomstring.generate(8);
                    var testObj = { email: email, pass: hash, secretString: secretString };
                    console.log(testObj);
                    dbObject.collection("userCollOne").insertOne(testObj, function (err, resp) {
                        if (err) throw err;
                        res.end("Email Registered !");
                        db.close();
                    });
                });
            }
        })
    });
});


app.post("/login", function (req, res) {
    var email = req.body.email;
    var pass = req.body.pass;

    console.log(email + " " + pass);

    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("pordDbOne");

        var testObj = { email: email, pass: pass };

        dbObject.collection("userCollOne").find({ email: email }).toArray(function (err, data) {
            if (err) throw err;
            if (data.length > 0) {
                bcrypt.compare(pass, data[0].pass, function (err, result) {
                    console.log(result);
                    if (result) {
                        res.end("Valid credentials !");
                    } else {
                        res.end("Invalid credentials !");
                    }
                });
            }
            else {
                console.log("Not Present");
                res.end("Email not registered !");
            }
        })
    });
});

app.post("/resetStepOne", function (req, res) {
    var email = req.body.email;

    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("pordDbOne");

        var testObj = { email: email };

        dbObject.collection("userCollOne").find({ email: email }).toArray(function (err, data) {
            if (err) throw err;
            if (data.length > 0) {
                var mailOptions = {
                    from: 'karthikeyan1997@gmail.com',
                    to: email,
                    subject: 'Test nodejs password reset secret',
                    text: 'The secret is ' + data[0].secretString
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                        res.status(500).send("error");
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).send('Email sent: ' + info.response);
                    }
                });
            }
            else {
                console.log("Not Present");
                res.status(400).send("Email not registered !");
            }
        })
    });
});

app.post("/resetStepTwo", function (req, res) {
    let secret = req.body.secret;
    let email = req.body.email;
    let newPass = req.body.newPass;

    const client = new MongoClient(uri);

    client.connect(function (err, db) {
        if (err) throw err;

        var dbObject = db.db("pordDbOne");

        dbObject.collection("userCollOne").find({ email: email }).toArray(function (err, data) {
            if (err) throw err;
            if (data.length > 0) {
                if (data[0].secretString === secret) {
                    let secretString = randomstring.generate(8);
                    bcrypt.hash(newPass, 10, function (error, hash) {
                        var newvalues = { $set: { email: email, pass: hash, secretString: secretString } };

                        dbObject.collection("userCollOne").updateOne({ email: email }, newvalues, function (dberr, dbdata) {
                            if (dberr) throw dberr;
                            res.status(200).send("Password updated");
                            db.close();
                        });
                    });
                }
                else{
                    res.status(400).send("Invalid secret");
                }
            }
            else {
                console.log("Not Present");
                res.status(400).send("Email not registered !");
            }
        })
    });
});