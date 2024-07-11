import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { dayjs } from '../lib/dayjs';
/* eslint-disable @typescript-eslint/no-unused-vars */

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/activities',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          accurs_at: z.coerce.date(),
        }),
      },
    },
    async (request) => {
      const { tripId } = request.params;
      const { title, accurs_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        throw new Error('Trip not found');
      }

      if (dayjs(accurs_at).isBefore(trip.starts_at)) {
        throw new Error('Invalid activity date.');
      }

      if (dayjs(accurs_at).isAfter(trip.ends_at)) {
        console.log('=-=-=', accurs_at, trip.starts_at);
        throw new Error('Invalid activity date.');
      }

      const activity = await prisma.activity.create({
        data: {
          title,
          accurs_at,
          trip_id: tripId,
        },
      });

      return { activity: activity.id };
    },
  );
}
