export default class ServiceError extends Error {
  statusCode: number;

  constructor(messageOrError: unknown, statusCode: number) {
    if (messageOrError instanceof Error) {
      super(messageOrError.message);
      this.stack = messageOrError.stack;
      this.cause = messageOrError.cause;
    } else {
      super(String(messageOrError));
    }
    this.statusCode = statusCode;
  }
}
