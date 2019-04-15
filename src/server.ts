import { ApolloServer } from "apollo-server-express";
import { PubSub } from "graphql-subscriptions";
import * as GraphiQL from "apollo-server-module-graphiql";
import * as cors from "cors";
import * as express from "express";
import * as cookie from "cookie-parser";

import schema from "./schema";

import { execute, subscribe } from "graphql";
import { createServer, Server } from "http";
import { SubscriptionServer } from "subscriptions-transport-ws";
import * as url from "url";
import {
  ConcreteUserAPI,
  InMemoryDataModelProviderFactory,
  ConcreteAdminAPI
} from "happy-hour-core";
import { Context } from "./types";

type ExpressGraphQLOptionsFunction = (
  req?: express.Request,
  res?: express.Response
) => any | Promise<any>;

function graphiqlExpress(options: GraphiQL.GraphiQLData | ExpressGraphQLOptionsFunction) {
  const graphiqlHandler = (req: express.Request, res: express.Response, next: any) => {
    const query = req.url && url.parse(req.url, true).query;
    GraphiQL.resolveGraphiQLString(query, options, req).then(
      (graphiqlString: any) => {
        res.setHeader("Content-Type", "text/html");
        res.write(graphiqlString);
        res.end();
      },
      (error: any) => next(error)
    );
  };

  return graphiqlHandler;
}

export default async (port: number): Promise<Server> => {
  const app = express();

  const server: Server = createServer(app);
  // TODO switch to a persist data provider.
  const dataProviderFactory = new InMemoryDataModelProviderFactory();
  const userAPI = new ConcreteUserAPI(dataProviderFactory);
  const adminAPI = new ConcreteAdminAPI(dataProviderFactory);
  const pubsub = new PubSub();
  const context = async (input: any): Promise<Context> => {
    const cookies = input.req.cookies;
    return {
      organizerId: cookies.organizerId,
      userId: cookies.userId,
      eventId: cookies.eventId,
      pubsub,
      userAPI,
      adminAPI
    };
  };

  app.use("*", cors({ origin: "http://localhost:3000" }));
  app.use(cookie());

  const apolloServer = new ApolloServer({
    context,
    playground: true,
    schema
  });

  apolloServer.applyMiddleware({ app, path: "/graphql" });

  if (module.hot) {
    app.use(
      "/graphiql",
      graphiqlExpress({
        endpointURL: "/graphql",
        query:
          "# Welcome to your own GraphQL server!\n#\n" +
          "# Press Play button above to execute GraphQL query\n#\n" +
          "# You can start editing source code and see results immediately\n\n" +
          "query hello($subject:String) {\n  hello(subject: $subject)\n}",
        subscriptionsEndpoint: `ws://localhost:${port}/subscriptions`,
        variables: { subject: "World" }
      })
    );
  }

  return new Promise<Server>(resolve => {
    server.listen(port, () => {
      // tslint:disable-next-line
      new SubscriptionServer(
        {
          execute,
          schema,
          subscribe
        },
        {
          path: "/subscriptions",
          server
        }
      );
      resolve(server);
    });
  });
};
