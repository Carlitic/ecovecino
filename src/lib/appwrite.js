import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const COLLECTIONS = {
    USERS: import.meta.env.VITE_APPWRITE_COLLECTION_ID_USERS,
    INCIDENTS: import.meta.env.VITE_APPWRITE_COLLECTION_ID_INCIDENTS,
    MEETINGS: import.meta.env.VITE_APPWRITE_COLLECTION_ID_MEETINGS,
    POSTS: import.meta.env.VITE_APPWRITE_COLLECTION_ID_POSTS,
    SERVICES: import.meta.env.VITE_APPWRITE_COLLECTION_ID_SERVICES,
    COMMUNITIES: import.meta.env.VITE_APPWRITE_COLLECTION_ID_COMMUNITIES
};

export default client;
