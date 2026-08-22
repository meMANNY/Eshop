/*
  Every service carried its own copy of the same three localhost origins, and
  they had already drifted: seller-service listed only 3000, so seller-ui could
  not call it directly at all.

  One list, overridable per environment. `CORS_ORIGIN` is comma-separated and
  kafka-service already reads it under that name, so this keeps a single
  variable across the whole workspace.

  All three ports stay in the default because Next dev takes the first free port
  from 3000 upward — which app lands on which port depends on start order.
*/
export const ALLOWED_ORIGINS = process.env.CORS_ORIGIN?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean) || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];
