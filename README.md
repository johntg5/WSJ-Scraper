This is an app that scrapes the top headlines for the Wall Street Journal and sends them to a mongodb database The database then retrieves them and allows users to save comments on each headline. Other users will be able to see and respond to these comments. This app can either be run on heroku or locally through node if the follwoing npm packages have been installed: cheerio, express, handlebars, mongoose, path, method-override, request, and body-parser.