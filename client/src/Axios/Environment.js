import * as env from '../Include/env';

const dev = {
              server: env.DEV_SERVER,
              paymentServer: env.DEV_PAY_SERVER
            };

const prod = {
               server: env.PROD_SERVER,
               paymentServer: env.PROD_PAY_SERVER
            };

export const environment = process.env.NODE_ENV === "production" ? prod : dev;