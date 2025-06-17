# S&P 500 Portfolio Frontend

This is a minimal React application that visualizes portfolio data from the backend.

## Available Pages

- **History** – shows allocation and prediction history
- **Current** – displays the latest portfolio allocation
- **Growth Overview** – charts performance over time

## Development

```bash
cd frontend
npm install   # install dependencies
npm start     # run the development server
```

The React dev server is configured to proxy API requests to `http://localhost:5000`.
Make sure the Flask backend is running on that port (update `package.json` if it uses a different port).

The application expects API endpoints to be served from the Flask backend:

- `/api/history`
- `/api/current`
- `/api/growth`

These endpoints should return JSON data compatible with the components in `src/pages`.
