# Roadmap

Each epic becomes a GitHub *issue* and is managed on the project board (see [GITHUB_PROJECTS.md](GITHUB_PROJECTS.md)).

## Epic 1 — "Parking administrator" role

A new role that manages a specific parking lot.

- [ ] Add the `Administrador de parqueadero` role to the `User` model and middleware.
- [ ] Associate the user with one or more parking lots.
- [ ] **Capacity control:** view and adjust current occupancy and available spots.
- [ ] **Slot control:** enable, disable, and mark slots as occupied or free.
- [ ] **Key custody:** record whether the user leaves the keys at the parking lot or keeps them.
  - Proposed states: `keeps_keys`, `handed_over`, `returned`.
  - The administrator confirms receipt and return.
- [ ] Views and tests for the role.

## Epic 2 — Per-parking organization

- [ ] Separate information by parking lot (zones, slots, reservations, payments).
- [ ] Parking lot filters in the admin views.
- [ ] Permissions: each parking administrator only sees their own parking lot.

## Epic 3 — Maps

- [ ] Add latitude and longitude to each parking lot.
- [ ] Integrate Google Maps (API key in `.env`, restricted by domain).
- [ ] Show the location and directions in the zones view.

## Epic 4 — Payment gateway

- [ ] Abstract the payment provider (common interface).
- [ ] Cash payment for testing.
- [ ] Wompi (sandbox).
- [ ] Bold.
- [ ] DaviPay.
- [ ] Webhooks and payment status reconciliation.

## Epic 5 — Documentation and quality

- [x] Professional README.
- [x] Contributing guide and issue / Pull Request templates.
- [ ] Automated tests.
- [ ] Continuous integration (GitHub Actions).
