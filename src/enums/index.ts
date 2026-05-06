export enum TrueValues {
  YES = "yes",
  TRUE = "true",
  ONE = "1",
}

export enum FalseValues {
  NO = "no",
  FALSE = "false",
  ZERO = "0",
}

export const STATUS_CODE = Object.freeze({
  OK: 200,
  CREATED: 201,
  UPDATED: 204,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT : 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_NOT_ACTIVE: 503
});
