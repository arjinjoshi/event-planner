import app from "./app";
import { config } from "./config";
import { connectDB } from "./configurations/db";

const startServer = async () => {
  await connectDB();

  app.listen(config.PORT, () => {
    console.log(` Server is running on PORT: ${config.PORT}`);
  });
};

startServer();
