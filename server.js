// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");
var methodOverride = require("method-override");
// Requiring our Note and Article models
var Note = require("./models/note.js");
var Article = require("./models/article.js");

// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;


// Initialize Express
var app = express();
var PORT = process.env.PORT || 3000;

// Use body parser with our app
app.use(bodyParser.urlencoded({
    extended: false
}));

// override with POST having ?_method=PUT
app.use(methodOverride('_method'));

// Make public a static dir
app.use(express.static("./public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.set('views', __dirname + '/views');
app.engine("handlebars", exphbs({ defaultLayout: "main", layoutsDir: __dirname + "/views/layouts" }));
app.set("view engine", "handlebars");

// Database configuration with mongoose
/*
var databaseUri = "mongodb://localhost/wsjscrape";
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
}
else {
    mongoose.connect(databaseUri);
}
var db = mongoose.connection;*/

mongoose.connect("mongodb://heroku_4hw234qr:rhd5v1uiccehb24ea185ppurbd@ds245337.mlab.com:45337/heroku_4hw234qr");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});

//=========Routes==========//

app.get("/", function(req, res) {
    Article.find({})
        .exec(function(error, data) {
            if (error) {
                res.send(error);
            }
            else {
                var newsObj = {
                    Article: data
                };
                res.render("index", newsObj);
            }
        });
});

// A GET request to scrape the website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("https://www.wsj.com/", function(error, response, html) {
        var $ = cheerio.load(html);
        $(".wsj-card").each(function(i, element) {

            var result = {};
            result.title = $(this).find(".wsj-headline-link").text();
            result.link = $(this).find(".wsj-headline-link").attr("href");
            result.description = $(this).find(".wsj-summary span:first-child").text()
            if (result.title && result.link && result.description) {
                var entry = new Article(result);

                entry.save(function(err, doc) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log(doc);
                    }
                });
            }
        });
    });
    res.redirect("/");
});

app.post("/notes/:id", function(req, res) {
    var newNote = new Note(req.body);
    newNote.save(function(error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            console.log("this is the DOC " + doc);
            Article.findOneAndUpdate({
                "_id": req.params.id
            }, { $push: { "note": doc._id } }, { new: true }, function(err, doc) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("note saved: " + doc);
                    res.redirect("/notes/" + req.params.id);
                }
            });
        }
    });
});

app.get("/notes/:id", function(req, res) {
    console.log("This is the req.params: " + req.params.id);
    Article.find({
            "_id": req.params.id
        }).populate("note")
        .exec(function(error, doc) {
            if (error) {
                console.log(error);
            }
            else {
                var notesObj = {
                    Article: doc
                };
                console.log(notesObj);
                res.render("notes", notesObj);
            }
        });
});

app.get("/delete/:id", function(req, res) {
    Note.remove({
        "_id": req.params.id
    }).exec(function(error, doc) {
        if (error) {
            console.log(error);
        }
        else {
            console.log("note deleted");
            res.redirect("/");
        }
    });
});

// Listen on port 3000
app.listen(PORT, function() {
    console.log("App running on PORT" + PORT + "!");
});
