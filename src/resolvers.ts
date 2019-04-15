import { Context } from "./types";

// const ITEM_SUBSCRIPTION = 'item_subscription';
// const CREDIT_SUBSCRIPTION = 'credit_subscription';

export default {
  Query: {
    async me(obj: any, args: any, context: Context) {
      const { userId, eventId, userAPI } = context;
      try {
        console.log(`userId: ${userId} and eventId ${eventId}`);
        const user = await userAPI.getUser(userId, eventId);
        return user;
      } catch (err) {
        console.log(err.message);
      }
      return undefined;
    },

    async event(obj: any, args: any, context: Context) {
      const { userId, eventId, userAPI } = context;
      try {
        const event = await userAPI.getEvent(userId, eventId);
        return event;
      } catch (err) {
        console.log(err.message);
      }
      return undefined;
    }
  },
  Mutation: {
    async createEvent(obj: any, args: any, context: Context) {
      const { organizerId, adminAPI } = context;
      return adminAPI.createEvent({
        ...args.input,
        organizerId,
        startAt: new Date(args.input.startAt),
        endAt: new Date(args.input.endAt)
      });
    }
  }
};
