# Use a lightweight Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy only requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code (app.py, scripts.py, etc.)
COPY . .

# Launch the Flask app via Gunicorn on port 5000
CMD ["python", "app.py"]