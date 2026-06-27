import {PrismaClient} from '@prisma/client';

//the global object lives for the lifetime of Node.js process
declare global{

    namespace globalThis {
        var prismadb: PrismaClient | undefined;
    }
};

const prisma = new PrismaClient();

if(process.env.NODE_ENV !== 'production') global.prismadb = prisma;
    

export default prisma;