import { PubSub } from "graphql-subscriptions";
import { UserAPI, AdminAPI } from "happy-hour-core";

export interface Context {
  organizerId?: string;
  userId?: string;
  eventId?: string;
  pubsub: PubSub;
  userAPI: UserAPI;
  adminAPI: AdminAPI;
}
