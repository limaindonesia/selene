import "reflect-metadata";
import express from "express";
import cors from "cors";
import http from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildSchema } from "type-graphql";

import { connectDB1, connectDB2 } from "./config/mongoConfig";
import env from "./config/envConfig";
import { 
  LegalFormResolver,
  CategoryResolver,
  UserDocumentResolver,
  UserInputResolver
} from "./resolvers";

// Create directory for storage keys if it doesn't exist
import fs from 'fs';
import path from 'path';
const storageDir = path.join(__dirname, '..', 'storage', 'keys');
fs.mkdirSync(storageDir, { recursive: true });

async function main() {
    const app = express();

    app.use(cors());
    const httpServer = http.createServer(app);

    await connectDB1();
    await connectDB2();

    const schema = await buildSchema({
        resolvers: [
            LegalFormResolver,
            CategoryResolver,
            UserDocumentResolver,
            UserInputResolver
        ],
        validate: false
    });

    const server = new ApolloServer({
        schema,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
    });

    await server.start();

    app.get('/', (req, res) => {
        res.send('LEGAL-FORM-SERVICE');
    });

    app.use(
        "/graphql",
        express.json(),
        expressMiddleware(server, {
            context: async ({ req, res }) => ({ 
                req, 
                res,
                clientId: req.headers['client_id'] as string 
            }),
        })
    );

    const PORT = env.port;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    });
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
