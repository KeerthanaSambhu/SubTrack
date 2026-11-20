/**
 * API Endpoints Adapter
 *
 * Configured to use the local demo persistence layer (localStorage + Web Crypto),
 * enabling complete functionality without an external database or server process.
 */

import { localAuthApi, localUserApi, localSubscriptionApi } from '../lib/storage';

export const authApi = localAuthApi;
export const userApi = localUserApi;
export const subscriptionApi = localSubscriptionApi;
