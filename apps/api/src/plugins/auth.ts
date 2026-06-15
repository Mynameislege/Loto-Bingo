import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import * as admin from 'firebase-admin';
import { FirebaseTokenPayload } from '@loto-seniors/shared';

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user: FirebaseTokenPayload;
  }
}

async function plugin(app: FastifyInstance): Promise<void> {
  // Initialize Firebase Admin once
  if (!admin.apps.length) {
    // Sur Railway (prod) : credentials en variable d'environnement JSON
    // En local : fichier pointé par GOOGLE_APPLICATION_CREDENTIALS
    const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
  }

  /**
   * Verify a Firebase ID token from the Authorization header.
   * Usage: add `preHandler: [app.authenticate]` to any route that requires auth.
   */
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const authHeader = request.headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing or malformed Authorization header' });
      }
      const token = authHeader.slice(7);
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        request.user = FirebaseTokenPayload.parse({
          uid: decoded.uid,
          email: decoded.email,
          name: decoded.name,
        });
      } catch {
        return reply.status(401).send({ error: 'Invalid or expired token' });
      }
    },
  );
}

export const authPlugin = fp(plugin, { name: 'auth' });

// Make authenticate available on app instance
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
