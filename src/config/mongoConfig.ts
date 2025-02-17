import mongoose, { Connection, ConnectOptions } from "mongoose";
import env from "./envConfig";

const getOptions = (username?: string, password?: string, database?: string): ConnectOptions => {
  const options: ConnectOptions = {
    dbName: database,
  };

  if (username && password) {
    options.user = username;
    options.pass = password;
  }

  return options;
};

export const connectDB1 = async (): Promise<Connection> => {
  try {
    const options = getOptions(
      env.mongodb1.username,
      env.mongodb1.password,
      env.mongodb1.database
    );
    const connection = mongoose.createConnection(env.mongodb1.uri || "", options);
    console.log("Connected to Database 1");
    return connection;
  } catch (error) {
    console.error("Error connecting to Database 1:", error);
    throw error;
  }
};

export const connectDB2 = async (): Promise<Connection> => {
  try {
    const options = getOptions(
      env.mongodb2.username,
      env.mongodb2.password,
      env.mongodb2.database
    );
    const connection = mongoose.createConnection(env.mongodb2.uri || "", options);
    console.log("Connected to Database 2");
    return connection;
  } catch (error) {
    console.error("Error connecting to Database 2:", error);
    throw error;
  }
};
