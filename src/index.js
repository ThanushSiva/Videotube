const dotenv = require("dotenv");
const { connectDB } = require("./db/index");
dotenv.config({ path: "./src/.env" });

const { app } = require("./app");

const PORT = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT || 7001, () => {
      console.log(`server is running in port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB connection error`);
  });
