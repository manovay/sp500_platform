---

### 1. **(Optional) Activate your virtual environment**
If you have one:
```bash
# On Windows
venv\Scripts\activate

# On Mac/Linux
source venv/bin/activate
```

---

### 2. **Install dependencies**
```bash
pip install -r requirements.txt
```

---

### 3. **Start your Docker containers**
```bash
docker-compose up -d
```
Wait a few seconds for the database to be ready.

---

### 4. **Check that the database container is running**
```bash
docker ps
```
You should see a `postgres` container running and listening on port 1111.

---

### 5. **Check your .env file**
Make sure it contains:
```
DATABASE_URL=postgresql://manovay:Padhai007@localhost:1111/sp500_db
FMP_API_KEY=your_fmp_api_key_here
```

---

### 6. **Initialize the database schema**
```bash
python init_db.py
```
You should see:
```
✅ Database schema created successfully
```

---

### 7. **Fetch and upsert S&P 500 tickers**
```bash
python fetch_tickers.py
```

---

### 8. **Fetch and upsert price data for tickers**
```bash
python fetch_prices.py
```

---

### 9. **Fetch and upsert analyst labels**
```bash
python fetch_analyst_labels.py
```

---

### 10. **(Optional) View your database in pgAdmin**
- Open your browser and go to: [http://localhost:8080](http://localhost:8080)
- Login with:
  - Email: `admin@example.com`
  - Password: `admin`
- Add a new server with:
  - Host: `postgres`
  - Port: `5432`
  - Username: `manovay`
  - Password: `Padhai007`
  - Database: `sp500_db`

---

## **Summary of Commands**
```bash
pip install -r requirements.txt
docker-compose up -d
python init_db.py
python fetch_tickers.py
python fetch_prices.py
python fetch_analyst_labels.py
```

---

## Frontend React App

A small React application is located in the `frontend/` directory and visualizes portfolio data from the API.

Run it with:

```bash
cd frontend
npm install
npm start
```

The app expects endpoints from a Flask backend such as `/api/history`, `/api/current`, and `/api/growth`. See [frontend/README.md](frontend/README.md) for details.
