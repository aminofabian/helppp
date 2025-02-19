import prisma from "./lib/db"; 

prisma.$use(async (params, next) => {
  if (params.model === "Request" && params.action === "update") {
    if (params.args.data.amount) {
      throw new Error("Request amount cannot be modified after creation.");
    }
  }
  return next(params);
});

export default prisma;
