# Use a lightweight Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy only requirements first (for Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code (app.py, scripts.py, etc.)
COPY backend/ .

# Copy ingestion scripts and schema
COPY ingestion/ ./ingestion/

# Launch the Flask app
CMD ["sh", "-c", "python simple_storage.py && python app.py"]