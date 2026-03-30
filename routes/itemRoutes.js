const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});
const upload = multer({ storage });

// CREATE
router.post("/items", auth, upload.single("image"), (req, res) => {
  const { title, description } = req.body;
  const image = req.file.filename;

  db.query(
    "INSERT INTO items (title,description,image,user_id) VALUES (?,?,?,?)",
    [title, description, image, req.user.id]
  );

  res.send("Item added");
});

// READ
router.get("/items", (req, res) => {
  db.query("SELECT * FROM items", (err, result) => {
    res.json(result);
  });
});

// DELETE
router.delete("/items/:id", (req, res) => {
  db.query("DELETE FROM items WHERE id=?", [req.params.id]);
  res.send("Deleted");
});

module.exports = router;