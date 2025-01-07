type Middleware = (next: Function, ...args: any[]) => Promise<any>;

export const LoggingMiddleware: Middleware = async (next, ...args) => {
  console.log(`Method called with args: ${JSON.stringify(args)}`);
  return await next();
};

export const ValidationMiddleware: Middleware = async (next, data: any) => {
  if (!data.title || !data.content) {
    throw new Error("Validation failed: Title and content are required.");
  }
  return await next();
};

export const ExecutionTimeMiddleware: Middleware = async (next, ...args) => {
  const start = Date.now();
  const result = await next();
  const end = Date.now();
  console.log(`Execution time: ${end - start}ms`);
  return result;
};
