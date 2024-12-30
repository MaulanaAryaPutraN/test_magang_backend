const express = require("express");
const routes = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const db = require("../connect_db");
const verifyToken = require("./middleware");

routes.use(bodyParser.json());

const JWT_SECRET = "1234SHA";

routes.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      status: "error",
      message: "Email and password are required",
    });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to query user",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    const user = result[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({
        status: "error",
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, {
      expiresIn: "2m",
    });

    res.status(200).send({
      status: "success",
      message: "Token successfully created",
      token,
    });
  });
});

routes.get("/verify", verifyToken, (req, res) => {
  res.status(200).send({
    status: "success",
    message: "Login successful",
    user: `WELCOME ${req.user.name} !!!`,
  });
});

module.exports = routes;
