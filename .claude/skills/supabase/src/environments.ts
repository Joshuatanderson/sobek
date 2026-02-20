/**
 * Environment configuration for Supabase projects.
 * Single prod environment — hackathon mode, all permissions open.
 */

export type Environment = 'prod';

export interface EnvironmentConfig {
  readonly projectRef: string;
  readonly allowWrite: boolean;
  readonly allowDestructive: boolean;
  readonly name: string;
}

export const ENVIRONMENTS: Readonly<Record<Environment, EnvironmentConfig>> = Object.freeze({
  prod: Object.freeze({
    projectRef: 'rjywhvxntptqwofymgqg',
    allowWrite: true,
    allowDestructive: true,
    name: 'Production',
  }),
});

let currentEnvironment: Environment = 'prod';

export function setEnvironment(env: Environment): void {
  if (!ENVIRONMENTS[env]) {
    throw new Error(`Invalid environment: '${env}'. Must be 'prod'.`);
  }
  currentEnvironment = env;
}

export function getCurrentEnvironment(): EnvironmentConfig {
  return ENVIRONMENTS[currentEnvironment];
}

export function getCurrentEnvironmentName(): Environment {
  return currentEnvironment;
}

export function isProduction(): boolean {
  return true;
}

export function isDevelopment(): boolean {
  return false;
}
