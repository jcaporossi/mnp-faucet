const express = require("express");
const path = require("path");
//var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

//This will enable you to access it form '/'
app.use("/", express.static(__dirname + "/frontend", { index: "index.html" }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/index.html"));
});

app.listen(8080, () => {
  console.log("Server started at http://localhost:" + 8080);
});
