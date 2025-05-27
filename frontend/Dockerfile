FROM node:16-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Set build-time arguments
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the application for production
RUN echo "Building with REACT_APP_API_URL=$REACT_APP_API_URL"
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/build ./build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
