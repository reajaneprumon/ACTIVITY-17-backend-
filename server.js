const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

const userRoutes = require("./routes/userRoutes");
const itemRoutes = require("./routes/itemRoutes");

app.use("/api", userRoutes);
app.use("/api", itemRoutes);

app.listen(3000, () => console.log("Server running on port 3000"));