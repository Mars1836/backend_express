const dev = {
  app: {
    port: process.env.DEV_APP_PORT || 4000,
  },
  db: {
    host: process.env.DEV_DB_HOST || "localhost",
    port: process.env.DEV_DB_PORT || "27018",
    name: process.env.DEV_DB_NAME || "shopDEV",
  },
};
const pro = {
  app: {
    port: process.env.PRO_APP_PORT || 4000,
  },
  db: {
    host: process.env.PRO_DB_HOST || "localhost",
    port: process.env.PRO_DB_PORT || "27018",
    name: process.env.PRO_DB_NAME || "shopPRO",
  },
};
const config = {
  pro,
  dev,
};
const env = process.env.NODE_ENV || "dev";
module.exports = config[env];
