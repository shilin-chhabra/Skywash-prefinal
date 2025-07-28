# ---------- front-end build stage ----------
FROM node:20-alpine AS build-frontend
WORKDIR /frontend
COPY frontend/ .
RUN npm ci \
 && npm run build                      # output -> dist/

# ---------- back-end runtime stage ----------
FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PORT=8000

# --- WAQI API token (build-time ARG, overrideable at runtime) ---
ARG WAQI_API_TOKEN=d637fde34e7053b3d3110c41de9b9ed82fa9e65e
ENV WAQI_API_TOKEN=${WAQI_API_TOKEN}

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend
# copy built SPA
COPY --from=build-frontend /frontend/dist ./static

# tiny entrypoint – serve BOTH API and static
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--root-path", ""]
EXPOSE 8000
HEALTHCHECK CMD python -c "import http.client,os; c=http.client.HTTPConnection('localhost',int(os.environ.get('PORT',8000))); c.request('GET','/api/cities'); print(c.getresponse().status)"
