export const PROD_ORIGIN = "https://andifila.github.io";
export const PROD_BASE   = "/hadirku";
export const PROD_URL    = `${PROD_ORIGIN}${PROD_BASE}`;
export const APP_BASE    = process.env.NODE_ENV === "production" ? PROD_BASE : "";
