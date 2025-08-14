import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
if (!process.env.DB_URI) {
  throw new Error('DB_URI must be defined in environment variables');
}
if (!process.env.DB_NAME) {
  throw new Error('DB_NAME must be defined in environment variables');
}
if (!process.env.PORT) {
  throw new Error('PORT must be defined in environment variables');
}
if (!process.env.NODE_ENV) {
  throw new Error('NODE_ENV must be defined in environment variables');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

const env = {
    PORT: process.env.PORT,
    DB_NAME: process.env.DB_NAME,
    DB_URI: process.env.DB_URI,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
};

export default env;