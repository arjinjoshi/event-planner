export class AppError extends Error {
  public readonly status: number;
  public readonly details: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.status = status ?? 500;
    this.details = details ?? null;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
