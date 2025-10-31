const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

let corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "session-secret-key-lab4",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }
}));

app.get("/", (req, res) => {
  res.json({ message: "Test lab 4!" });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

const db = require("./app/models");
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
  db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
  });
}

module.exports = app;
