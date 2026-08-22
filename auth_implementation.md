# Campaign Chronicle Authentication

Campaign Chronicle uses the shared Web Hatchery identity portal. It does not
own a login or registration flow.

## User flow

1. A signed-in Web Hatchery user enters Campaign Chronicle and is passed
   through with the root bearer token.
2. A visitor without a full account is sent to the Web Hatchery login page with
   a same-origin return URL. After login or registration, the portal returns
   the visitor to Campaign Chronicle.
3. A visitor may choose **Continue as guest**. Campaign Chronicle creates a
   short-lived, app-scoped guest session and stores guest-owned campaign data
   under that guest identity.
4. While using a guest session, the visitor may sign in or register at the
   root portal. If both the full account and guest session contain data, the
   app presents the available choices: keep the full account, keep the guest
   data, or merge the two datasets. The guest token must be supplied to the
   link endpoint and is verified server-side.

## API surface

The app exposes only the shared-auth bridge and application APIs:

- `GET /api/auth/current-user` validates the shared bearer token.
- `POST /api/auth/guest-session` creates an app guest session.
- `POST /api/auth/link-guest` links guest data after a full account login.
- `POST /api/auth/link-guest/preview` returns the data summary used by the
  merge confirmation UI.

There are no Campaign Chronicle `/auth/login` or `/auth/register` endpoints.
Unauthenticated protected requests return HTTP 401 with a `login_url` value;
the API does not redirect or silently log users out.

## Configuration

The Campaign Chronicle backend and the Web Hatchery frontpage must use the
same production `JWT_SECRET`. The backend also requires:

```dotenv
JWT_SECRET=<shared-production-webhatchery-secret>
WEBHATCHERY_LOGIN_URL=https://webhatchery.au/login
```

The frontend requires `VITE_WEBHATCHERY_LOGIN_URL` and
`VITE_WEBHATCHERY_SIGNUP_URL`, both pointing to the root portal.

## Data migration

Existing Campaign Chronicle records remain in the Campaign Chronicle
database. Run the app's ordered schema migration and then
`backend/migrate_auth.php` on deployments that predate the shared-auth
columns or optional feature tables. Back up the database first and verify the
migration output before opening the app to users. No new central auth tables
are required in the Web Hatchery database.

See `D:\WebHatchery\apps\AUTHENTICATION_ROLLOUT.md` for the cross-app rollout,
production checklist, and rollback guidance.
