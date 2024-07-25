export default class ServiceError extends Error {
  statusCode?: number;

  constructor(messageOrError: string | Error, statusCode: number) {
    super(
      typeof messageOrError === 'object'
        ? messageOrError.message
        : messageOrError,
      messageOrError === 'object' ? { cause: messageOrError } : undefined
    );
    this.statusCode = statusCode;
  }
}
