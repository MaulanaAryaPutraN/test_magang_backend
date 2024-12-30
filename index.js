const express = require("express");
const app = express();
const port = 3000;
const body = require("body-parser");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const authRoutes = require("./routes/auth");

app.use(bodyParser.json());

app.use("/", userRoutes);
app.use("/", projectRoutes);
app.use("/", taskRoutes);
app.use("/", authRoutes);

app.listen(port, () => {
  console.log(`AKSES API : http://localhost:${port}`);
});
