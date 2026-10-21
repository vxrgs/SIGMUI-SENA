// Error con código HTTP. Se lanza en las rutas y el manejador global lo convierte en JSON.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
