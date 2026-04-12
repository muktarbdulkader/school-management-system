import Backend from '../../services/backend';
import { Storage } from 'configration/storage';

let cachedPermissions = []; // store permissions in memory
let permissionsFetched = false; // whether we've attempted to fetch
let permissionsPromise = null; // used to dedupe concurrent requests

/**
 * Fetch permissions (deduped). Optionally pass a token to avoid race with Storage timing.
 * Returns the cached permissions array.
 */
export const fetchUserPermissions = async (tokenParam) => {
    console.log("Fetching skkKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKdkdkkd")
  // If already fetched, return the cache
  if (permissionsFetched && cachedPermissions.length > 0) {
    return cachedPermissions;
  }

  // Deduplicate concurrent fetches
  if (permissionsPromise) return permissionsPromise;

  permissionsPromise = (async () => {
    try {
      const token = tokenParam || Storage.getItem('token');
      if (!token) {
        // If no token, mark that we attempted a fetch so hasPermission won't keep waiting forever.
        permissionsFetched = true;
        console.warn('fetchUserPermissions: no token found in Storage');
        return cachedPermissions;
      }

      const Api = `${Backend.api}${Backend.permissions}`;
      const header = {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
        'Content-Type': 'application/json',
      };

      const response = await fetch(Api, { headers: header });
      if (!response.ok) {
        // If 401 we probably want to clear cache (token invalid). For other errors, keep old cache.
        if (response.status === 401) {
          console.warn(
            'fetchUserPermissions: 401 Unauthorized - clearing cached permissions',
          );
          cachedPermissions = [];
        }
        throw new Error(
          `Failed to fetch permissions (status: ${response.status})`,
        );
      }

      const body = await response.json();
      const permissions =
        body.data?.flatMap((role) => role.permissions || []) || [];
      cachedPermissions = permissions;
      permissionsFetched = true;
      return cachedPermissions;
    } catch (err) {
      // Important: do NOT destructively wipe cachedPermissions on every error.
      // Keep whatever we had so UI/logic won't flip to an empty permission set unexpectedly.
      console.error('Error fetching permissions:', err);
      permissionsFetched = true; // mark that we tried
      return cachedPermissions;
    } finally {
      permissionsPromise = null;
    }
  })();

  return permissionsPromise;
};

/**
 * Async permission check that waits for permissions to be available.
 * Use this in code paths where you can `await` (e.g., navigation guards, button handlers).
 */
export async function hasPermissionAsync(permissionName) {
  console.log('Fetch permission', permissionName, cachedPermissions);
  const alwaysAllowed = [
    'create:kpitracker',
    'update:kpitracker',
    'delete:lesson',
    'delete:kpitracker',
  ];
  if (alwaysAllowed.includes(permissionName)) return true;

  await fetchUserPermissions();
  return cachedPermissions.some((p) => p.name === permissionName);
}

// Call this at app startup to populate cache (optional)
export async function initPermissions() {
  // only attempt if we haven't already
  if (!permissionsFetched) {
    await fetchUserPermissions();
  }
}
