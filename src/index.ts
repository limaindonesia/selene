import "reflect-metadata";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from "express";
import cors from "cors";
import { buildSchema } from "type-graphql";
import { LegalFormResolver } from "./resolvers/legalFormResolver";
import http from 'http';
import bodyParser from "body-parser";
import { connectDB1, connectDB2 } from "./config/mongoConfig";
import env from "./config/envConfig";


async function main() {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
  
    const httpServer = http.createServer(app);

    await connectDB1();
    await connectDB2();

    const schema = await buildSchema({
        resolvers: [LegalFormResolver],
        validate: false // Add this if you're having validation issues
    });

    const server = new ApolloServer({
        schema,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
    });

    await server.start();

    app.get('/', (req, res) => { res.send('LEGAL-FORM-SERVICE') });

    app.use(
        "/graphql",
        cors<cors.CorsRequest>(),
        bodyParser.json(),
        expressMiddleware(server)
    );

    const PORT = env.port;
    await new Promise<void>((resolve) => {
        httpServer.listen({ port: PORT }, resolve);
    });

    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});