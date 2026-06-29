# Multi-stage build for Java Spring Boot application
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 as builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre

WORKDIR /app

# Install wget for healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copy JAR from builder
COPY --from=builder /app/target/*.jar app.jar

# Create logs directory and uploads
RUN mkdir -p logs uploads && \
    addgroup --system rexi && \
    adduser --system --ingroup rexi rexi && \
    chown -R rexi:rexi /app

USER rexi

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8081}/api/system/health || exit 1

# Run application with environment variables
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xmx220m", "-Xms128m", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=64m", "-jar", "app.jar"]

