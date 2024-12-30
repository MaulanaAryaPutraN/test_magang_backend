const express = require("express");
const routes = express.Router();
const multer = require("multer");
const db = require("../connect_db");
const bcrypt = require("bcrypt");
const path = require("path");

routes.get("/user", (req, res) => {
  db.query(
    "SELECT nip, name, email, gender, address FROM users ",
    (error, result) => {
      if (error) {
        res.status(500).send({
          status: "error",
          message: "Failed to get user",
          error: error.message,
        });
      } else {
        res.status(200).send({
          status: "success",
          message: "Successfully get all data users",
          data: result,
        });
      }
    }
  );
});
routes.get("/user/:nip", (req, res) => {
  const nip = req.params.nip;
  db.query(
    `SELECT nip, name, email, gender, address FROM users WHERE nip = ${nip}`,
    (error, result) => {
      if (error) {
        res.status(500).send({
          status: "error",
          message: "Failed to get data",
          error: error.message,
        });
      } else if (result.length === 0) {
        res.status(404).send({
          status: "error",
          message: "User not found",
        });
      } else {
        res.status(200).send({
          status: "success",
          message: "Successfully get data user",
          data: result,
        });
      }
    }
  );
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

routes.post("/user", upload.single("avatar"), async (req, res) => {
  const { nip, name, email, password, gender, address } = req.body;
  const avatar = req.file ? req.file.path : null;
  if (!nip || !name || !email || !password || !gender || !address) {
    return res.status(400).send({
      status: "error",
      message: "All fields are required",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (nip, name, email, password, gender, address, avatar) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [nip, name, email, hashedPassword, gender, address, avatar],
      (error, result) => {
        if (error) {
          return res.status(500).send({
            status: "error",
            message: "Failed to insert user",
            error: error.message,
          });
        }

        res.status(201).send({
          status: "success",
          message: "User added successfully",
          data: {
            nip,
            name,
            email,
            gender,
            address,
            avatar,
          },
        });
      }
    );
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: "Failed to process request",
      error: error.message,
    });
  }
});

routes.put("/user/:nip", upload.single("avatar"), (req, res) => {
  const nip = req.params.nip;
  const { name, email, gender, address, password } = req.body;
  const avatar = req.file ? req.file.path : null;

  if (!name && !email && !gender && !address && !avatar && !password) {
    return res.status(400).send({
      status: "error",
      message: "At least one field is required to update",
    });
  }

  const checkUserQuery = "SELECT id FROM users WHERE nip = ?";
  db.query(checkUserQuery, [nip], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to check user",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    let hashedPassword = null;
    if (password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).send({
            status: "error",
            message: "Failed to hash password",
            error: err.message,
          });
        }

        hashedPassword = hash;

        const updateUserQuery = `
          UPDATE users
          SET name = COALESCE(?, name),
              email = COALESCE(?, email),
              gender = COALESCE(?, gender),
              address = COALESCE(?, address),
              avatar = COALESCE(?, avatar),
              password = COALESCE(?, password)
          WHERE nip = ?
        `;

        const values = [
          name,
          email,
          gender,
          address,
          avatar || null,
          hashedPassword || null,
          nip,
        ];

        db.query(updateUserQuery, values, (error, result) => {
          if (error) {
            return res.status(500).send({
              status: "error",
              message: "Failed to update user data",
              error: error.message,
            });
          }

          res.status(200).send({
            status: "success",
            message: "User data updated successfully",
            data: {
              nip,
              name: name || result.name,
              email: email || result.email,
              gender: gender || result.gender,
              address: address || result.address,
              avatar: avatar || result.avatar,
            },
          });
        });
      });
    } else {
      const updateUserQuery = `
        UPDATE users
        SET name = COALESCE(?, name),
            email = COALESCE(?, email),
            gender = COALESCE(?, gender),
            address = COALESCE(?, address),
            avatar = COALESCE(?, avatar)
        WHERE nip = ?
      `;

      const values = [name, email, gender, address, avatar, nip];

      db.query(updateUserQuery, values, (error, result) => {
        if (error) {
          return res.status(500).send({
            status: "error",
            message: "Failed to update user data",
            error: error.message,
          });
        }

        res.status(200).send({
          status: "success",
          message: "User data updated successfully",
          data: {
            nip,
            name: name || result.name,
            email: email || result.email,
            gender: gender || result.gender,
            address: address || result.address,
            avatar: avatar || result.avatar,
          },
        });
      });
    }
  });
});

routes.delete("/user/:nip", (req, res) => {
  const { nip } = req.params;

  const checkUserQuery = "SELECT nip FROM users WHERE nip = ?";
  db.query(checkUserQuery, [nip], (error, result) => {
    if (error) {
      return res.status(500).send({
        status: "error",
        message: "Failed to check user",
        error: error.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    const deleteUserQuery = "DELETE FROM users WHERE nip = ?";
    db.query(deleteUserQuery, [nip], (deleteError, deleteResult) => {
      if (deleteError) {
        return res.status(500).send({
          status: "error",
          message: "Failed to delete user",
          error: deleteError.message,
        });
      }

      res.status(200).send({
        status: "success",
        message: "User deleted successfully",
      });
    });
  });
});
module.exports = routes;
