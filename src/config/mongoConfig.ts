import mongoose, { Connection, ConnectOptions } from "mongoose";
import env from "./envConfig";

const options1: ConnectOptions = {
    user: env.mongodb1.username,
    pass: env.mongodb1.password,
    dbName: env.mongodb1.database,
};

const options2: ConnectOptions = {
    user: env.mongodb2.username,
    pass: env.mongodb2.password,
    dbName: env.mongodb2.database,
};

export const connectDB1 = async (): Promise<Connection> => {
  try {
    const connection = mongoose.createConnection(env.mongodb2.uri || "", options1);
    console.log("Connected to Database 1");
    return connection;
  } catch (error) {
    console.error("Error connecting to Database 1:", error);
    throw error;
  }
};

export const connectDB2 = async (): Promise<Connection> => {
  try {
    const connection = mongoose.createConnection(env.mongodb2.uri || "", options2);
    console.log("Connected to Database 2");
    return connection;
  } catch (error) {
    console.error("Error connecting to Database 2:", error);
    throw error;
  }
};
