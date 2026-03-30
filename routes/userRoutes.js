const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const multer = require("multer");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage });

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");

    db.query(
      "INSERT INTO users (name,email,password,verification_token) VALUES (?,?,?,?)",
      [name, email, hashed, token],
      async (err, result) => {

        if (err) {
          console.error(err);
          return res.status(500).json({
            success: false,
            message: "Database insert failed"
          });
        }

        if (result.affectedRows === 1) {
          const link = `http://localhost:3000/api/verify/${token}`;

          await sendEmail(
            email,
            "Verify Account",
            `<a href="${link}">Verify</a>`
          );

          return res.json({
            success: true,
            message: "Registered successfully. Check email."
          });
        } else {
          return res.json({
            success: false,
            message: "Registration failed"
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// VERIFY
router.get("/verify/:token", (req, res) => {
  const token = req.params.token;

  db.query(
    "UPDATE users SET email_verified=1 WHERE verification_token=?",
    [token]
  );

  res.send("Account verified");
});

// LOGIN
router.post("/login", (req, res) => {
  try{
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email=?", [email], async (err, result) => {
      const user = result[0];
      if (!user) return res.send("User not found");

      if (!user.email_verified)
        return res.json({message: "Verify your email first"});

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.json({message: "Wrong password"});

      const token = jwt.sign({ id: user.id }, "secret");
      res.json({ user: user, success: true, message:"Successfully logged in", token });
    });
  }catch(err){
    console.log(err);
    res.json({ message: "Server error" });
  }
});

// PROFILE UPDATE
router.put("/profile", auth, upload.single("image"), (req, res) => {
  const { name } = req.body;
  const image = req.file?.filename;

  db.query(
    "UPDATE users SET name=?, profile_image=? WHERE id=?",
    [name, image, req.user.id]
  );

  res.json({message: "Profile updated"});
});

router.get("/profile", auth, (req, res) => {
  db.query(
    "SELECT id, name, email, profile_image FROM users WHERE id=?",
    [req.user.id],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.json({
          message: "Database error"
        });
      }

      if (result.length === 0) {
        return res.json({
          message: "User not found"
        });
      }

      res.json({
        success: true,
        user: result[0]
      });
    }
  );
});

// FORGOT PASSWORD
router.post("/forgot", (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString("hex");

  db.query(
    "UPDATE users SET reset_token=? WHERE email=?",
    [token, email]
  );

  const link = `http://localhost:3000/reset.html?token=${token}`;
  sendEmail(email, "Reset Password", `<a href="${link}">Reset</a>`);

  res.json({message: "Reset link sent"});
});

// RESET PASSWORD
router.post("/reset/:token", async (req, res) => {
  const { password } = req.body;
  const token = req.params.token;

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "UPDATE users SET password=? WHERE reset_token=?",
    [hashed, token]
  );

  res.json({message: "Password updated"});
});

module.exports = router;